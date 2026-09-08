// index.ts — Main handler for the email-scan Edge Function
// Orchestrates: Gmail search → pattern classification → dedup → AI classify →
//               capture → storage upload → metadata extraction → document import

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { decrypt } from '../_shared/crypto.ts'

import {
  refreshAccessToken,
  searchAllEmails,
  getMessage,
  getHeader,
  getBodyText,
  getAttachments,
} from './gmail.ts'

import { buildSearchQuery, classifyByPattern } from './patterns.ts'

import { isAlreadyImported } from './dedup.ts'

import { classifyEmail, extractDocumentMeta } from './classifier.ts'

import { captureDocument, uploadToStorage, extractEmlDocuments } from './capture.ts'

import {
  importDocument,
  importCampsiteBooking,
  buildMotiNotification,
  postMotiMessage,
  ImportResult,
} from './importer.ts'

// ---------------------------------------------------------------------------
// CORS headers (matching the moti-chat pattern)
// ---------------------------------------------------------------------------

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://shanimosco47-pixel.github.io'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

function corsResponse(body: BodyInit | null, init: ResponseInit = {}): Response {
  return new Response(body, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...(init.headers ?? {}),
    },
  })
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

// Hosted edge functions are killed at a wall-clock limit. Each message costs a
// Gmail fetch, a dedup query and often an LLM call and a storage upload, all
// sequential, so a large mailbox can outlive the request. Stop cleanly before
// that happens: a partially-completed scan that reports what it skipped is
// recoverable, one that is killed mid-import is not. Dedup makes the next scan
// resume rather than repeat.
const PROCESSING_BUDGET_MS = 90_000

Deno.serve(async (req) => {
  const deadline = Date.now() + PROCESSING_BUDGET_MS

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    })
  }

  if (req.method !== 'POST') {
    return corsResponse(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
    })
  }

  // ------------------------------------------------------------------
  // Environment variables
  // ------------------------------------------------------------------
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
  const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
  const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
  const TOKEN_ENCRYPTION_KEY = Deno.env.get('TOKEN_ENCRYPTION_KEY')

  if (
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY ||
    !OPENAI_API_KEY ||
    !GOOGLE_CLIENT_ID ||
    !GOOGLE_CLIENT_SECRET ||
    !TOKEN_ENCRYPTION_KEY
  ) {
    return corsResponse(JSON.stringify({ error: 'Missing required environment variables' }), {
      status: 500,
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // ------------------------------------------------------------------
  // Parse request body
  // ------------------------------------------------------------------
  let mode: 'full' | 'targeted' | 'rescan' = 'full'
  let queryOverride: string | undefined

  try {
    const body = await req.json()
    if (body.mode === 'targeted') mode = 'targeted'
    else if (body.mode === 'rescan') mode = 'rescan'
    queryOverride = body.query as string | undefined
  } catch {
    // Use defaults if body is missing/malformed
  }

  console.log(`[email-scan] Starting scan. mode=${mode}`)

  // ------------------------------------------------------------------
  // Step 1: Fetch approved email accounts
  // ------------------------------------------------------------------
  const { data: accounts, error: accountsError } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('is_approved', true)

  if (accountsError) {
    console.error('[email-scan] Failed to fetch email accounts:', accountsError.message)
    return corsResponse(JSON.stringify({ error: 'Failed to fetch email accounts' }), {
      status: 500,
    })
  }

  if (!accounts || accounts.length === 0) {
    return corsResponse(
      JSON.stringify({ message: 'No approved email accounts found', results: [] }),
      { status: 200 },
    )
  }

  // ------------------------------------------------------------------
  // Rescan mode: recover files for existing fileless documents
  // ------------------------------------------------------------------
  if (mode === 'rescan') {
    const { data: filelessDocs, error: filelessError } = await supabase
      .from('documents')
      .select('id, source_email_id, title')
      .is('file_url', null)
      .not('source_email_id', 'is', null)

    if (filelessError) {
      console.error('[email-scan] Failed to query fileless documents:', filelessError.message)
      return corsResponse(JSON.stringify({ error: 'Failed to query fileless documents' }), {
        status: 500,
      })
    }

    if (!filelessDocs || filelessDocs.length === 0) {
      return corsResponse(
        JSON.stringify({ message: 'No fileless documents found — nothing to fix.', fixed: 0 }),
        { status: 200 },
      )
    }

    console.log(`[email-scan] Rescan: found ${filelessDocs.length} fileless document(s)`)

    // Build access tokens for all accounts
    const accountTokens: { email: string; accessToken: string }[] = []
    for (const account of accounts) {
      try {
        const refreshToken = await decrypt(account.refresh_token, TOKEN_ENCRYPTION_KEY)
        const accessToken = await refreshAccessToken(
          refreshToken,
          GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET,
        )
        accountTokens.push({ email: account.email, accessToken })
      } catch (err) {
        console.error(`[email-scan] Rescan: token refresh failed for ${account.email}:`, err)
      }
    }

    let fixedCount = 0

    for (const doc of filelessDocs) {
      let captured: Awaited<ReturnType<typeof captureDocument>> = null

      // Try each account to find the one that owns this email
      for (const { email, accessToken } of accountTokens) {
        try {
          const message = await getMessage(accessToken, doc.source_email_id)
          captured = await captureDocument(accessToken, doc.source_email_id, message)
          if (captured) {
            console.log(`[email-scan] Rescan: captured file for "${doc.title}" via ${email}`)
            break
          }
        } catch {
          // Message not found in this account — try next
        }
      }

      if (!captured) {
        console.warn(
          `[email-scan] Rescan: could not capture file for "${doc.title}" (${doc.source_email_id})`,
        )
        continue
      }

      const fileUrl = await uploadToStorage(supabase, captured, true)
      if (!fileUrl) {
        console.error(`[email-scan] Rescan: upload failed for "${doc.title}"`)
        continue
      }

      const { error: updateError } = await supabase
        .from('documents')
        .update({
          file_url: fileUrl,
          file_type: captured.contentType,
          file_size: captured.data.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', doc.id)

      if (updateError) {
        console.error(`[email-scan] Rescan: failed to update doc ${doc.id}:`, updateError.message)
      } else {
        fixedCount++
        console.log(`[email-scan] Rescan: fixed "${doc.title}" — ${fileUrl}`)
      }
    }

    return corsResponse(
      JSON.stringify({
        message: `Rescan complete. Fixed ${fixedCount} of ${filelessDocs.length} document(s).`,
        fixed: fixedCount,
      }),
      { status: 200 },
    )
  }

  // ------------------------------------------------------------------
  // Step 2: Process each email account
  // ------------------------------------------------------------------
  const allResults: ImportResult[] = []
  // Diagnostic stats per account
  const diagnostics: {
    account: string
    query: string
    found: number
    irrelevant: number
    deduped: number
    aiRejected: number
    noFile: number
    imported: number
    errors: string[]
  }[] = []

  // Authenticate every account BEFORE any of the time budget is spent, so that
  // the budget is shared only between mailboxes that can actually be read. Doing
  // this inside the processing loop reserved a share for accounts that turned
  // out to be dead: with one working and one revoked account, the working
  // mailbox stopped at its half and the revoked one failed instantly, leaving
  // the other half unused. Authentication is two HTTP calls and costs no
  // meaningful time.
  const authenticated: { account: (typeof accounts)[number]; accessToken: string }[] = []

  // Concurrently, because the shared deadline is already running: one slow or
  // hanging token endpoint would otherwise eat the processing window of every
  // mailbox queued behind it, including the healthy ones.
  const authResults = await Promise.allSettled(
    accounts.map(async (account) => {
      const refreshToken = await decrypt(account.refresh_token, TOKEN_ENCRYPTION_KEY)
      return await refreshAccessToken(refreshToken, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
    }),
  )

  // Partitioned in the original order so the scan order stays deterministic.
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i]
    const outcome = authResults[i]

    if (outcome.status === 'fulfilled') {
      authenticated.push({ account, accessToken: outcome.value })
      continue
    }

    console.error(`[email-scan] Token refresh failed for ${account.email}:`, outcome.reason)
    // Google answers a revoked or expired refresh token with invalid_grant.
    // Everything else here (a 5xx, a rate limit, a failed decrypt) is
    // transient or local, and telling the user to reconnect would be wrong
    // advice, so the two are reported under distinct prefixes.
    const detail = String(outcome.reason)
    const prefix = detail.includes('invalid_grant') ? 'token_revoked' : 'token_refresh_failed'
    diagnostics.push({
      account: account.email,
      query: '',
      found: 0,
      irrelevant: 0,
      deduped: 0,
      aiRejected: 0,
      noFile: 0,
      imported: 0,
      errors: [`${prefix}: ${detail}`],
    })
  }

  for (let accountIndex = 0; accountIndex < authenticated.length; accountIndex++) {
    const { account, accessToken } = authenticated[accountIndex]
    console.log(`[email-scan] Processing account: ${account.email}`)
    const diag = {
      account: account.email,
      query: '',
      found: 0,
      irrelevant: 0,
      deduped: 0,
      aiRejected: 0,
      noFile: 0,
      imported: 0,
      errors: [] as string[],
    }

    // Build search query
    let searchQuery: string
    if (mode === 'targeted' && queryOverride) {
      searchQuery = queryOverride
    } else {
      // Always scan the full trip window rather than only since the last scan, so
      // older or forwarded confirmations that earlier scans missed still get
      // imported. Dedup (isAlreadyImported) prevents re-importing anything already
      // captured, so re-examining the whole window is safe.
      searchQuery = buildSearchQuery(null)
    }
    diag.query = searchQuery

    // Search emails
    let messageRefs: { id: string; threadId: string }[] = []
    try {
      const searchResult = await searchAllEmails(accessToken, searchQuery)
      messageRefs = searchResult.messages
      if (searchResult.truncated) {
        diag.errors.push('search_truncated: more matches exist than the page cap allows')
        console.warn(`[email-scan] Result set truncated for ${account.email}`)
      }
    } catch (err) {
      console.error(`[email-scan] Search failed for ${account.email}:`, err)
      diag.errors.push(`search_failed: ${err}`)
      diagnostics.push(diag)
      continue
    }

    // Gmail returns newest-first, but confirmations are the OLDEST matches:
    // bookings are made months ahead while the recent end of the window is
    // mostly advertising. Process oldest-first so that if the budget runs out,
    // what got imported is the part actually worth having.
    messageRefs.reverse()

    diag.found = messageRefs.length
    console.log(`[email-scan] Found ${messageRefs.length} messages for ${account.email}`)

    // Split the remaining time evenly across the mailboxes still to be scanned.
    // A single global deadline let the first mailbox consume all of it: with 494
    // matches on account one, account two was reached with zero budget left and
    // scanned nothing, silently. Whoever is scanned last is exactly the person
    // whose confirmations are missing, so every readable mailbox gets a
    // guaranteed share, and one that finishes early hands the rest to the next.
    const accountsRemaining = authenticated.length - accountIndex
    const accountDeadline = Date.now() + Math.max(0, (deadline - Date.now()) / accountsRemaining)

    // Process each message.
    //
    // Fetching them one at a time made the budget the binding constraint rather
    // than the mailbox: a 494-match mailbox got through 76 messages before the
    // clock ran out, and because the message order is deterministic and only
    // IMPORTED messages are remembered, the next run re-fetched the same 76 and
    // stopped in the same place. Running the scan again made no progress at
    // all; the older confirmations simply stayed unreachable.
    //
    // The dominant cost is the round trip to Gmail, so messages are fetched a
    // batch at a time in parallel while everything that writes (dedup, AI
    // classification, capture, import) stays strictly sequential, exactly as
    // before. Only one batch is held in memory at once.
    const FETCH_BATCH = 8
    let processed = 0
    let budgetSpent = false

    for (let start = 0; start < messageRefs.length && !budgetSpent; start += FETCH_BATCH) {
      const batch = messageRefs.slice(start, start + FETCH_BATCH)
      const fetched = await Promise.allSettled(batch.map((ref) => getMessage(accessToken, ref.id)))

      for (let j = 0; j < batch.length; j++) {
        const ref = batch[j]
        if (Date.now() > accountDeadline) {
          const remaining = messageRefs.length - processed
          diag.errors.push(`budget_exhausted: ${remaining} message(s) not processed this run`)
          console.warn(`[email-scan] Time budget reached, ${remaining} left for ${account.email}`)
          budgetSpent = true
          break
        }
        processed++

        const fetchResult = fetched[j]
        if (fetchResult.status === 'rejected') {
          diag.errors.push(`msg_${ref.id}: ${fetchResult.reason}`)
          console.error(`[email-scan] Failed to fetch message ${ref.id}:`, fetchResult.reason)
          continue
        }
        const message = fetchResult.value

        try {
          const subject = getHeader(message, 'subject')
          const from = getHeader(message, 'from')
          const bodyText = getBodyText(message)

          // Pattern classification (pass body for forwarded-sender detection)
          const patternResult = classifyByPattern(from, subject, bodyText)
          if (patternResult === 'irrelevant') {
            diag.irrelevant++
            console.log(`[email-scan] Irrelevant: "${subject}" from="${from}"`)
            continue
          }

          // Dedup check
          const alreadyImported = await isAlreadyImported(supabase, message.id, bodyText, subject)
          if (alreadyImported) {
            diag.deduped++
            console.log(`[email-scan] Skipping duplicate: ${subject}`)
            continue
          }

          // AI classify if uncertain
          if (patternResult === 'uncertain') {
            const { category } = await classifyEmail(OPENAI_API_KEY, subject, bodyText)
            if (!category) {
              diag.aiRejected++
              console.log(`[email-scan] AI classified as irrelevant: ${subject}`)
              continue
            }
          }

          // ---- Check for .eml attachments first ----
          const emlDocs = await extractEmlDocuments(accessToken, message.id, message)

          if (emlDocs.length > 0) {
            // Process each .eml as a separate document
            console.log(`[email-scan] Found ${emlDocs.length} .eml attachment(s) in: ${subject}`)

            for (let i = 0; i < emlDocs.length; i++) {
              const emlDoc = emlDocs[i]
              const emlFileUrl = await uploadToStorage(supabase, emlDoc.file)
              if (!emlFileUrl) {
                console.warn(`[email-scan] Failed to upload .eml file ${i} from: ${subject}`)
                continue
              }

              // Use the inner .eml content for AI classification
              const emlMeta = await extractDocumentMeta(
                OPENAI_API_KEY,
                emlDoc.parsed.subject,
                emlDoc.parsed.bodyText,
                emlDoc.parsed.from,
                [],
              )

              // Dedup: check if this inner .eml was already imported (by subject)
              const emlAlreadyImported = await isAlreadyImported(
                supabase,
                `${message.id}-eml-${i}`,
                emlDoc.parsed.bodyText,
                emlDoc.parsed.subject,
              )
              if (emlAlreadyImported) {
                console.log(`[email-scan] Skipping duplicate .eml: ${emlDoc.parsed.subject}`)
                continue
              }

              const emlResult = await importDocument(supabase, {
                title: emlMeta.title,
                category: emlMeta.category,
                locationId: emlMeta.locationId,
                amount: emlMeta.amount,
                currency: emlMeta.currency,
                fileUrl: emlFileUrl,
                fileType: emlDoc.file.contentType,
                fileSize: emlDoc.file.data.length,
                notes: emlMeta.notes,
                sourceEmailId: `${message.id}-eml-${i}`,
                expiryDate: emlMeta.expiry_date,
                familyMemberId: emlMeta.family_member_id,
              })

              allResults.push(emlResult)
              console.log(
                `[email-scan] Imported .eml: ${emlResult.title} (${emlResult.documentId})`,
              )

              await importCampsiteBooking(supabase, {
                title: emlMeta.title,
                category: emlMeta.category,
                locationId: emlMeta.locationId,
                amount: emlMeta.amount,
                currency: emlMeta.currency,
                fileUrl: emlFileUrl,
                fileType: emlDoc.file.contentType,
                fileSize: emlDoc.file.data.length,
                notes: emlMeta.notes,
                sourceEmailId: `${message.id}-eml-${i}`,
                checkInDate: emlMeta.check_in_date,
                expiryDate: emlMeta.expiry_date,
                familyMemberId: emlMeta.family_member_id,
                confirmation: emlMeta.confirmation,
                documentId: emlResult.documentId,
              })
            }
          } else {
            // ---- Normal flow: capture from this email directly ----
            const capturedFile = await captureDocument(accessToken, message.id, message)

            let fileUrl: string | null = null
            let fileType: string | null = null
            let fileSize: number | null = null

            if (capturedFile) {
              fileUrl = await uploadToStorage(supabase, capturedFile)
              fileType = capturedFile.contentType
              fileSize = capturedFile.data.length
            }

            // Guard: never create a document without a file
            if (!fileUrl) {
              diag.noFile++
              console.warn(`[email-scan] Skipping message ${ref.id} — no file could be captured`)
              continue
            }

            // Extract metadata via AI
            const attachmentNames = getAttachments(message).map((a) => a.filename)
            const meta = await extractDocumentMeta(
              OPENAI_API_KEY,
              subject,
              bodyText,
              from,
              attachmentNames,
            )

            const result = await importDocument(supabase, {
              title: meta.title,
              category: meta.category,
              locationId: meta.locationId,
              amount: meta.amount,
              currency: meta.currency,
              fileUrl,
              fileType,
              fileSize,
              notes: meta.notes,
              sourceEmailId: message.id,
              expiryDate: meta.expiry_date,
              familyMemberId: meta.family_member_id,
            })

            allResults.push(result)
            diag.imported++
            console.log(`[email-scan] Imported: ${result.title} (${result.documentId})`)

            await importCampsiteBooking(supabase, {
              title: meta.title,
              category: meta.category,
              locationId: meta.locationId,
              amount: meta.amount,
              currency: meta.currency,
              fileUrl,
              fileType,
              fileSize,
              notes: meta.notes,
              sourceEmailId: message.id,
              checkInDate: meta.check_in_date,
              expiryDate: meta.expiry_date,
              familyMemberId: meta.family_member_id,
              confirmation: meta.confirmation,
              documentId: result.documentId,
            })
          }
        } catch (err) {
          diag.errors.push(`msg_${ref.id}: ${err}`)
          console.error(`[email-scan] Failed to process message ${ref.id}:`, err)
          // Continue with next message
        }
      }
    }

    diagnostics.push(diag)

    // ------------------------------------------------------------------
    // Step 3: Update last_scan_at for the account
    // ------------------------------------------------------------------
    const { error: updateError } = await supabase
      .from('email_accounts')
      .update({ last_scan_at: new Date().toISOString() })
      .eq('id', account.id)

    if (updateError) {
      console.error(
        `[email-scan] Failed to update last_scan_at for ${account.email}:`,
        updateError.message,
      )
    }
  }

  // ------------------------------------------------------------------
  // Step 4: Post Moti notification if anything was imported
  // ------------------------------------------------------------------
  const notification = buildMotiNotification(allResults)
  await postMotiMessage(supabase, notification)

  console.log(`[email-scan] Done. Imported ${allResults.length} document(s).`)

  // ------------------------------------------------------------------
  // Step 5: Return results
  // ------------------------------------------------------------------
  return corsResponse(
    JSON.stringify({
      message: `Scan complete. Imported ${allResults.length} document(s).`,
      results: allResults,
      diagnostics,
    }),
    { status: 200 },
  )
})
