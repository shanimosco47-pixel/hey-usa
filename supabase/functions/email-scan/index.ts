// index.ts — Main handler for the email-scan Edge Function
// Orchestrates: Gmail search → pattern classification → dedup → AI classify →
//               capture → storage upload → metadata extraction → document import

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { decrypt } from '../_shared/crypto.ts'

import {
  refreshAccessToken,
  searchEmails,
  getMessage,
  getHeader,
  getBodyText,
  getAttachments,
} from './gmail.ts'

import { buildSearchQuery, classifyByPattern } from './patterns.ts'

import { isAlreadyImported } from './dedup.ts'

import { classifyEmail, extractDocumentMeta } from './classifier.ts'

import { captureDocument, uploadToStorage } from './capture.ts'

import { importDocument, buildMotiNotification, postMotiMessage, ImportResult } from './importer.ts'

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

Deno.serve(async (req) => {
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
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
  const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
  const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
  const TOKEN_ENCRYPTION_KEY = Deno.env.get('TOKEN_ENCRYPTION_KEY')

  if (
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY ||
    !ANTHROPIC_API_KEY ||
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
  let mode: 'full' | 'targeted' = 'full'
  let queryOverride: string | undefined

  try {
    const body = await req.json()
    mode = body.mode === 'targeted' ? 'targeted' : 'full'
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
  // Step 2: Process each email account
  // ------------------------------------------------------------------
  const allResults: ImportResult[] = []

  for (const account of accounts) {
    console.log(`[email-scan] Processing account: ${account.email}`)

    let accessToken: string
    try {
      const refreshToken = await decrypt(account.refresh_token, TOKEN_ENCRYPTION_KEY)
      accessToken = await refreshAccessToken(refreshToken, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
    } catch (err) {
      console.error(`[email-scan] Token refresh failed for ${account.email}:`, err)
      continue
    }

    // Build search query
    let searchQuery: string
    if (mode === 'targeted' && queryOverride) {
      searchQuery = queryOverride
    } else {
      searchQuery = buildSearchQuery(account.last_scan_at ?? null)
    }

    // Search emails
    let searchResult
    try {
      searchResult = await searchEmails(accessToken, searchQuery, 50)
    } catch (err) {
      console.error(`[email-scan] Search failed for ${account.email}:`, err)
      continue
    }

    const messageRefs = searchResult.messages ?? []
    console.log(`[email-scan] Found ${messageRefs.length} messages for ${account.email}`)

    // Process each message
    for (const ref of messageRefs) {
      try {
        // Get full message
        const message = await getMessage(accessToken, ref.id)

        const subject = getHeader(message, 'subject')
        const from = getHeader(message, 'from')
        const bodyText = getBodyText(message)

        // Pattern classification
        const patternResult = classifyByPattern(from, subject)
        if (patternResult === 'irrelevant') {
          continue
        }

        // Dedup check
        const alreadyImported = await isAlreadyImported(supabase, message.id, bodyText, subject)
        if (alreadyImported) {
          console.log(`[email-scan] Skipping duplicate: ${subject}`)
          continue
        }

        // AI classify if uncertain
        if (patternResult === 'uncertain') {
          const { category } = await classifyEmail(ANTHROPIC_API_KEY, subject, bodyText)
          if (!category) {
            console.log(`[email-scan] AI classified as irrelevant: ${subject}`)
            continue
          }
        }

        // Capture document (attachment or HTML body)
        const capturedFile = await captureDocument(accessToken, message.id, message)

        // Upload to Supabase storage
        let fileUrl: string | null = null
        let fileType: string | null = null
        let fileSize: number | null = null

        if (capturedFile) {
          fileUrl = await uploadToStorage(supabase, capturedFile)
          fileType = capturedFile.contentType
          fileSize = capturedFile.data.length
        }

        // Extract metadata via AI
        const attachmentNames = getAttachments(message).map((a) => a.filename)
        const meta = await extractDocumentMeta(
          ANTHROPIC_API_KEY,
          subject,
          bodyText,
          from,
          attachmentNames,
        )

        // Import document into database
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
        console.log(`[email-scan] Imported: ${result.title} (${result.documentId})`)
      } catch (err) {
        console.error(`[email-scan] Failed to process message ${ref.id}:`, err)
        // Continue with next message
      }
    }

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
    }),
    { status: 200 },
  )
})
