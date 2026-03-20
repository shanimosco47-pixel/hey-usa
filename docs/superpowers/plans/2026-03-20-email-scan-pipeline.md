# Email Scan Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automated Gmail scanning that finds travel booking emails, captures documents, and imports them into the Hey USA app with auto-classification and Moti notifications.

**Architecture:** A Supabase Edge Function (`email-scan`) handles all server-side logic: Gmail API access, pattern/AI email classification, attachment download, HTML-to-image capture, Supabase Storage upload, document/expense record creation, and Moti chat notifications. The app triggers it via a button or Moti command; a pg_cron job triggers it every 6 hours.

**Tech Stack:** Deno (Edge Function), Gmail API v1, Supabase Storage, Claude API (via existing proxy pattern), React + TypeScript (UI), pg_cron + pg_net (scheduling).

**Spec:** `docs/superpowers/specs/2026-03-20-email-scan-pipeline-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `supabase/migrations/005_email_accounts.sql` | Create `email_accounts` table + add `source_email_id` to documents |
| `supabase/functions/email-scan/index.ts` | Main Edge Function entry point — route `full` vs `targeted` mode |
| `supabase/functions/email-scan/gmail.ts` | Gmail API client: auth, search, read messages, download attachments |
| `supabase/functions/email-scan/patterns.ts` | Known senders/keywords lists + pattern matching logic |
| `supabase/functions/email-scan/classifier.ts` | AI classification for uncertain emails + document metadata extraction |
| `supabase/functions/email-scan/capture.ts` | Attachment download + HTML-to-image rendering |
| `supabase/functions/email-scan/dedup.ts` | Deduplication: check source_email_id, booking refs, title similarity |
| `supabase/functions/email-scan/importer.ts` | Create document + expense records in Supabase, post Moti notification |
| `supabase/functions/email-oauth/index.ts` | OAuth callback handler: exchange auth code for refresh token |
| `src/lib/emailScan.ts` | Client-side API: trigger scan, get accounts, connect/disconnect Gmail |
| `src/modules/documents/components/EmailScanButton.tsx` | "סרוק אימייל" button with spinner + results toast |
| `src/modules/documents/components/EmailAccountSettings.tsx` | Connected accounts card: list, connect, disconnect |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/types.ts` | Add `source_email_id?: string` to `Document` interface |
| `src/contexts/AppDataContext.tsx` | Add `triggerEmailScan`, `emailAccounts` state + methods |
| `src/modules/chat/botEngine.ts` | Add `SEARCH_EMAIL` action type + regex patterns |
| `supabase/functions/moti-chat/index.ts` | Add `search_email` tool definition for Claude |
| `src/modules/documents/DocumentsPage.tsx` | Add scan button + settings section to header |
| `src/modules/dashboard/DashboardPage.tsx` | Add scan quick action card |
| `src/lib/database.ts` | Add `fetchEmailAccounts`, `insertEmailAccount`, `deleteEmailAccount` |

---

## Chunk 1: Database Schema & Types

### Task 1: Migration — email_accounts table + source_email_id column

**Files:**
- Create: `supabase/migrations/005_email_accounts.sql`
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Write the migration SQL**

```sql
-- supabase/migrations/005_email_accounts.sql

-- Gmail account connections for email scanning
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  last_scan_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Track which documents were imported from email (prevents re-import)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_email_id TEXT;
CREATE INDEX IF NOT EXISTS idx_documents_source_email ON documents (source_email_id);
```

- [ ] **Step 2: Apply migration to remote Supabase**

Run the SQL via the Supabase dashboard SQL Editor or CLI:
```bash
# If using Supabase CLI:
supabase db push
# Or paste the SQL directly in the Supabase dashboard SQL Editor
```

- [ ] **Step 3: Update Document type**

In `src/lib/types.ts`, add `source_email_id` to the Document interface:
```typescript
export interface Document {
  id: string;
  title: string;
  category: string;
  family_member_id?: FamilyMemberId;
  file_url?: string;
  thumbnail_url?: string;
  file_type?: string;
  file_size?: number;
  notes?: string;
  expiry_date?: string;
  locationId?: string;
  source_email_id?: string;  // Gmail message ID — prevents re-import
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/005_email_accounts.sql src/lib/types.ts
git commit -m "feat: add email_accounts table and source_email_id column"
```

---

### Task 2: Database helper functions

**Files:**
- Modify: `src/lib/database.ts`

- [ ] **Step 1: Add email account CRUD functions**

Add to `src/lib/database.ts`:

```typescript
// ─── Email Accounts ─────────────────────────────────────────────────

export async function fetchEmailAccounts() {
  const sb = assertSupabase()
  const { data, error } = await sb.from('email_accounts').select('*').order('created_at')
  if (error) { console.warn('fetchEmailAccounts error:', error); return [] }
  return data ?? []
}

export async function insertEmailAccount(account: { email: string; label: string; refresh_token: string }) {
  const sb = assertSupabase()
  const { error } = await sb.from('email_accounts').insert(account)
  if (error) throw error
}

export async function deleteEmailAccount(id: string) {
  const sb = assertSupabase()
  const { error } = await sb.from('email_accounts').delete().eq('id', id)
  if (error) throw error
}

export async function updateEmailAccountLastScan(id: string) {
  const sb = assertSupabase()
  await sb.from('email_accounts').update({ last_scan_at: new Date().toISOString() }).eq('id', id)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/database.ts
git commit -m "feat: add email account database helpers"
```

---

## Chunk 2: Edge Function — Gmail API & Pattern Matching

### Task 3: Gmail API client module

**Files:**
- Create: `supabase/functions/email-scan/gmail.ts`

- [ ] **Step 1: Write Gmail API client**

```typescript
// supabase/functions/email-scan/gmail.ts
// Gmail API client — auth token refresh, search, read, download attachments

const GMAIL_API = 'https://www.googleapis.com/gmail/v1'
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token'

interface GmailMessage {
  id: string
  threadId: string
  snippet: string
  payload: {
    headers: Array<{ name: string; value: string }>
    mimeType: string
    body?: { data?: string; attachmentId?: string; size: number }
    parts?: Array<{
      mimeType: string
      filename?: string
      body?: { data?: string; attachmentId?: string; size: number }
      parts?: Array<{
        mimeType: string
        body?: { data?: string }
      }>
    }>
  }
}

interface GmailSearchResult {
  messages?: Array<{ id: string; threadId: string }>
  nextPageToken?: string
  resultSizeEstimate: number
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  const data = await res.json()
  return data.access_token
}

export async function searchEmails(
  accessToken: string,
  query: string,
  maxResults = 50,
): Promise<GmailSearchResult> {
  const params = new URLSearchParams({ q: query, maxResults: String(maxResults) })
  const res = await fetch(`${GMAIL_API}/users/me/messages?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Gmail search failed: ${res.status}`)
  return res.json()
}

export async function getMessage(
  accessToken: string,
  messageId: string,
): Promise<GmailMessage> {
  const res = await fetch(`${GMAIL_API}/users/me/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Gmail get message failed: ${res.status}`)
  return res.json()
}

export async function getAttachment(
  accessToken: string,
  messageId: string,
  attachmentId: string,
): Promise<string> {
  const res = await fetch(
    `${GMAIL_API}/users/me/messages/${messageId}/attachments/${attachmentId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!res.ok) throw new Error(`Gmail get attachment failed: ${res.status}`)
  const data = await res.json()
  return data.data // base64url encoded
}

export function getHeader(msg: GmailMessage, name: string): string {
  return msg.payload.headers.find(
    (h) => h.name.toLowerCase() === name.toLowerCase(),
  )?.value ?? ''
}

export function getBodyText(msg: GmailMessage): string {
  // Try to get plain text body, fallback to HTML
  const parts = msg.payload.parts ?? []
  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'))
    }
  }
  // Try HTML
  for (const part of parts) {
    if (part.mimeType === 'text/html' && part.body?.data) {
      const html = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'))
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    }
  }
  // Single-part message
  if (msg.payload.body?.data) {
    return atob(msg.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
  }
  return msg.snippet
}

export function getBodyHtml(msg: GmailMessage): string | null {
  const parts = msg.payload.parts ?? []
  for (const part of parts) {
    if (part.mimeType === 'text/html' && part.body?.data) {
      return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'))
    }
    // Check nested parts (multipart/alternative inside multipart/mixed)
    if (part.parts) {
      for (const sub of part.parts) {
        if (sub.mimeType === 'text/html' && sub.body?.data) {
          return atob(sub.body.data.replace(/-/g, '+').replace(/_/g, '/'))
        }
      }
    }
  }
  if (msg.payload.mimeType === 'text/html' && msg.payload.body?.data) {
    return atob(msg.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
  }
  return null
}

export function getAttachments(msg: GmailMessage): Array<{
  filename: string
  mimeType: string
  attachmentId: string
  size: number
}> {
  const parts = msg.payload.parts ?? []
  const attachments: Array<{
    filename: string
    mimeType: string
    attachmentId: string
    size: number
  }> = []
  for (const part of parts) {
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        attachmentId: part.body.attachmentId,
        size: part.body.size,
      })
    }
  }
  return attachments
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/email-scan/gmail.ts
git commit -m "feat: Gmail API client module for email-scan edge function"
```

---

### Task 4: Pattern matching module

**Files:**
- Create: `supabase/functions/email-scan/patterns.ts`

- [ ] **Step 1: Write pattern matching logic**

```typescript
// supabase/functions/email-scan/patterns.ts
// First-pass email classification via known senders and subject keywords

const KNOWN_SENDERS = [
  'united.com', 'aircanada.com', 'delta.com', 'aa.com', 'elal.com',
  'recreation.gov', 'xanterra.com',
  'booking.com', 'airbnb.com', 'hotels.com', 'expedia.com',
  'cruiseamerica.com', 'rvshare.com', 'bandana.co.il',
  'rentalcover.com', 'passportcard.co.il', 'harel-group.co.il',
  'tripit.com',
]

const SUBJECT_KEYWORDS = [
  'confirmation', 'itinerary', 'reservation', 'booking', 'receipt',
  'e-ticket', 'eticket', 'rental agreement', 'your trip', 'your order',
  'אישור', 'הזמנה', 'קבלה', 'כרטיס', 'הזמנת',
]

const EXCLUDE_KEYWORDS = [
  'newsletter', 'unsubscribe', 'marketing', 'promo', 'sale',
  'survey', 'feedback', 'rate your', 'הירשם',
]

export type MatchResult = 'definite' | 'uncertain' | 'irrelevant'

export function classifyByPattern(
  fromEmail: string,
  subject: string,
): MatchResult {
  const from = fromEmail.toLowerCase()
  const subj = subject.toLowerCase()

  // Exclude obvious non-booking emails
  if (EXCLUDE_KEYWORDS.some((kw) => subj.includes(kw))) return 'irrelevant'

  const knownSender = KNOWN_SENDERS.some((domain) => from.includes(domain))
  const hasKeyword = SUBJECT_KEYWORDS.some((kw) => subj.includes(kw))

  if (knownSender && hasKeyword) return 'definite'
  if (knownSender || hasKeyword) return 'uncertain'
  return 'irrelevant'
}

export function buildSearchQuery(lastScanAt: string | null): string {
  const senderQueries = KNOWN_SENDERS.map((s) => `from:${s}`).join(' OR ')
  const keywordQueries = SUBJECT_KEYWORDS
    .filter((k) => !k.match(/[\u0590-\u05FF]/)) // skip Hebrew for Gmail search (unreliable)
    .map((k) => `subject:${k}`)
    .join(' OR ')

  let dateFilter = ''
  if (lastScanAt) {
    const d = new Date(lastScanAt)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    dateFilter = ` after:${yyyy}/${mm}/${dd}`
  } else {
    // First scan: last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const yyyy = sixMonthsAgo.getFullYear()
    const mm = String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')
    const dd = String(sixMonthsAgo.getDate()).padStart(2, '0')
    dateFilter = ` after:${yyyy}/${mm}/${dd}`
  }

  return `(${senderQueries} OR ${keywordQueries})${dateFilter}`
}

export function extractBookingRefs(text: string): string[] {
  const refs: string[] = []
  // Alphanumeric booking codes (5-10 chars, uppercase)
  const codeMatches = text.match(/\b[A-Z0-9]{5,10}\b/g)
  if (codeMatches) refs.push(...codeMatches)
  // Numeric refs with # prefix
  const hashMatches = text.match(/#\d{6,}/g)
  if (hashMatches) refs.push(...hashMatches.map((m) => m.replace('#', '')))
  // Numeric refs with "order" or "confirmation" nearby
  const orderMatches = text.match(/(?:order|confirmation|booking|ref)[:\s#]*(\d{4,})/gi)
  if (orderMatches) {
    for (const m of orderMatches) {
      const num = m.match(/\d{4,}/)
      if (num) refs.push(num[0])
    }
  }
  return [...new Set(refs)]
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/email-scan/patterns.ts
git commit -m "feat: pattern matching module for email classification"
```

---

### Task 5: Deduplication module

**Files:**
- Create: `supabase/functions/email-scan/dedup.ts`

- [ ] **Step 1: Write dedup logic**

```typescript
// supabase/functions/email-scan/dedup.ts
// Check if an email has already been imported as a document

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { extractBookingRefs } from './patterns.ts'

export async function isAlreadyImported(
  supabase: ReturnType<typeof createClient>,
  emailMessageId: string,
  emailBodyText: string,
  emailSubject: string,
): Promise<boolean> {
  // Check 1: exact email ID match
  const { data: byEmailId } = await supabase
    .from('documents')
    .select('id')
    .eq('source_email_id', emailMessageId)
    .limit(1)
  if (byEmailId && byEmailId.length > 0) return true

  // Check 2: booking reference match against existing document notes
  const refs = extractBookingRefs(emailBodyText)
  if (refs.length > 0) {
    const { data: allDocs } = await supabase
      .from('documents')
      .select('id, notes')
      .not('notes', 'is', null)
    if (allDocs) {
      for (const doc of allDocs) {
        if (!doc.notes) continue
        for (const ref of refs) {
          if (doc.notes.includes(ref)) return true
        }
      }
    }
  }

  // Check 3: title similarity (simple substring match)
  const subjectClean = emailSubject
    .replace(/^(re:|fwd?:|fw:)\s*/gi, '')
    .trim()
    .slice(0, 60)
  if (subjectClean.length > 10) {
    const { data: byTitle } = await supabase
      .from('documents')
      .select('id')
      .ilike('title', `%${subjectClean.slice(0, 30)}%`)
      .limit(1)
    if (byTitle && byTitle.length > 0) return true
  }

  return false
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/email-scan/dedup.ts
git commit -m "feat: deduplication module for email scan"
```

---

### Task 6: AI classifier module

**Files:**
- Create: `supabase/functions/email-scan/classifier.ts`

- [ ] **Step 1: Write AI classification logic**

```typescript
// supabase/functions/email-scan/classifier.ts
// AI-powered email classification and document metadata extraction

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

interface ClassifyResult {
  category: string | null // null = irrelevant
}

interface DocumentMeta {
  title: string
  category: string
  locationId: string | null
  amount: number | null
  currency: string | null
  expiry_date: string | null
  family_member_id: string | null
  notes: string
}

export async function classifyEmail(
  apiKey: string,
  subject: string,
  bodySnippet: string,
): Promise<ClassifyResult> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Is this email related to a USA family trip in Sep 2026? If yes, reply with ONLY the category. If no, reply "irrelevant".

Categories: flights, accommodation, car_rental, attractions, insurance, visa, medical, other

Subject: ${subject}
Body: ${bodySnippet.slice(0, 500)}`,
      }],
    }),
  })
  if (!res.ok) return { category: null }
  const data = await res.json()
  const text = (data.content?.[0]?.text ?? '').trim().toLowerCase()
  if (text === 'irrelevant' || text.includes('irrelevant')) return { category: null }
  const validCategories = ['flights', 'accommodation', 'car_rental', 'attractions', 'insurance', 'visa', 'medical', 'other']
  const matched = validCategories.find((c) => text.includes(c))
  return { category: matched ?? 'other' }
}

export async function extractDocumentMeta(
  apiKey: string,
  subject: string,
  bodyText: string,
  sender: string,
  attachmentNames: string[],
): Promise<DocumentMeta> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Extract booking document metadata from this email. Reply ONLY with valid JSON.

{
  "title": "Hebrew title describing the document",
  "category": "flights|accommodation|car_rental|attractions|insurance|visa|medical|other",
  "locationId": "denver|bozeman|yellowstone|grand-teton|jackson|bryce-canyon|zion|las-vegas|mammoth-lakes|yosemite|san-francisco|null",
  "amount": number_or_null,
  "currency": "USD|ILS|null",
  "expiry_date": "YYYY-MM-DD or null",
  "family_member_id": "aba|ima|kid1|kid2|kid3|null",
  "notes": "Key booking details: confirmation number, dates, names, important info. In Hebrew."
}

Subject: ${subject}
From: ${sender}
Attachments: ${attachmentNames.join(', ') || 'none'}
Body (first 2000 chars): ${bodyText.slice(0, 2000)}`,
      }],
    }),
  })

  const fallback: DocumentMeta = {
    title: subject,
    category: 'other',
    locationId: null,
    amount: null,
    currency: null,
    expiry_date: null,
    family_member_id: null,
    notes: bodyText.slice(0, 300),
  }

  if (!res.ok) return fallback

  try {
    const data = await res.json()
    const text = data.content?.[0]?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return fallback
    return { ...fallback, ...JSON.parse(jsonMatch[0]) }
  } catch {
    return fallback
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/email-scan/classifier.ts
git commit -m "feat: AI classifier for email classification and metadata extraction"
```

---

## Chunk 3: Edge Function — Capture, Import & Main Handler

### Task 7: Capture module (attachments + HTML-to-image)

**Files:**
- Create: `supabase/functions/email-scan/capture.ts`

- [ ] **Step 1: Write capture logic**

```typescript
// supabase/functions/email-scan/capture.ts
// Download PDF attachments or convert HTML emails to images

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getAttachment, getAttachments, getBodyHtml } from './gmail.ts'
import type { GmailMessage } from './gmail.ts'

interface CapturedFile {
  fileName: string
  contentType: string
  data: Uint8Array
}

export async function captureDocument(
  accessToken: string,
  messageId: string,
  message: GmailMessage,
): Promise<CapturedFile | null> {
  // Priority 1: PDF or image attachments
  const attachments = getAttachments(message)
  const docAttachment = attachments.find(
    (a) =>
      a.mimeType === 'application/pdf' ||
      a.mimeType.startsWith('image/'),
  )

  if (docAttachment) {
    const base64url = await getAttachment(accessToken, messageId, docAttachment.attachmentId)
    // Convert base64url to standard base64
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
    const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    const ext = docAttachment.mimeType === 'application/pdf' ? 'pdf' : 'png'
    return {
      fileName: `${messageId}.${ext}`,
      contentType: docAttachment.mimeType,
      data: binary,
    }
  }

  // Priority 2: Convert HTML email body to a stored HTML file
  // (Rendering to image requires a browser — we store the HTML as-is
  //  and let the app's DocumentViewer render it in an iframe)
  const html = getBodyHtml(message)
  if (html) {
    const wrappedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:20px}</style></head><body>${html}</body></html>`
    const encoder = new TextEncoder()
    return {
      fileName: `${messageId}.html`,
      contentType: 'text/html',
      data: encoder.encode(wrappedHtml),
    }
  }

  return null
}

export async function uploadToStorage(
  supabase: ReturnType<typeof createClient>,
  file: CapturedFile,
): Promise<string | null> {
  const { error } = await supabase.storage
    .from('documents')
    .upload(file.fileName, file.data, {
      contentType: file.contentType,
      upsert: false,
    })

  if (error) {
    console.warn('Storage upload error:', error.message)
    // If file already exists, get the URL anyway
    if (!error.message.includes('already exists')) return null
  }

  const { data } = supabase.storage.from('documents').getPublicUrl(file.fileName)
  return data.publicUrl
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/email-scan/capture.ts
git commit -m "feat: document capture module - attachments and HTML fallback"
```

---

### Task 8: Importer module (create records + Moti notification)

**Files:**
- Create: `supabase/functions/email-scan/importer.ts`

- [ ] **Step 1: Write importer logic**

```typescript
// supabase/functions/email-scan/importer.ts
// Create document + expense records, post Moti chat notification

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ImportedDoc {
  title: string
  category: string
  locationId: string | null
  amount: number | null
  currency: string | null
  fileUrl: string | null
  fileType: string
  fileSize: number
  notes: string
  sourceEmailId: string
  expiryDate: string | null
  familyMemberId: string | null
}

interface ImportResult {
  documentId: string
  title: string
  category: string
  amount: number | null
  currency: string | null
}

const CATEGORY_EMOJI: Record<string, string> = {
  flights: '✈️',
  accommodation: '🏨',
  car_rental: '🚐',
  attractions: '🎟️',
  insurance: '🛡️',
  visa: '📋',
  medical: '🏥',
  other: '📄',
}

export async function importDocument(
  supabase: ReturnType<typeof createClient>,
  doc: ImportedDoc,
): Promise<ImportResult> {
  const now = new Date().toISOString()
  const docId = `scan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  // Insert document
  await supabase.from('documents').insert({
    id: docId,
    title: doc.title,
    category: doc.category,
    family_member_id: doc.familyMemberId,
    file_url: doc.fileUrl,
    file_type: doc.fileType,
    file_size: doc.fileSize,
    notes: doc.notes,
    expiry_date: doc.expiryDate,
    location_id: doc.locationId,
    source_email_id: doc.sourceEmailId,
    created_at: now,
    updated_at: now,
  })

  // Insert expense if amount detected
  if (doc.amount && doc.amount > 0) {
    const expenseCategory = doc.category === 'car_rental' ? 'transport' : doc.category
    await supabase.from('expenses').insert({
      id: `exp-scan-${Date.now()}`,
      title: doc.title,
      amount: doc.amount,
      currency: doc.currency || 'USD',
      category: expenseCategory,
      paid_by: doc.familyMemberId || 'aba',
      date: now.split('T')[0],
      notes: `יובא אוטומטית מאימייל: ${doc.notes.slice(0, 100)}`,
      created_at: now,
    })
  }

  return {
    documentId: docId,
    title: doc.title,
    category: doc.category,
    amount: doc.amount,
    currency: doc.currency,
  }
}

export function buildMotiNotification(results: ImportResult[]): string {
  if (results.length === 0) return ''

  const lines = [`🔍 סריקת אימייל הושלמה! מצאתי ${results.length} מסמכים חדשים:`]
  for (const r of results) {
    const emoji = CATEGORY_EMOJI[r.category] || '📄'
    const amountStr = r.amount ? ` — ${r.currency || '$'}${r.amount.toLocaleString()}` : ''
    lines.push(`${emoji} ${r.title}${amountStr}`)
  }
  return lines.join('\n')
}

export async function postMotiMessage(
  supabase: ReturnType<typeof createClient>,
  text: string,
) {
  if (!text) return
  await supabase.from('chat_messages').insert({
    id: `moti-scan-${Date.now()}`,
    role: 'assistant',
    content: text,
    created_at: new Date().toISOString(),
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/email-scan/importer.ts
git commit -m "feat: document importer with expense logging and Moti notifications"
```

---

### Task 9: Main Edge Function handler

**Files:**
- Create: `supabase/functions/email-scan/index.ts`

- [ ] **Step 1: Write main handler**

```typescript
// supabase/functions/email-scan/index.ts
// Main entry point — orchestrates scan flow

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { refreshAccessToken, searchEmails, getMessage, getHeader, getBodyText } from './gmail.ts'
import { classifyByPattern, buildSearchQuery } from './patterns.ts'
import { isAlreadyImported } from './dedup.ts'
import { classifyEmail, extractDocumentMeta } from './classifier.ts'
import { captureDocument, uploadToStorage } from './capture.ts'
import { importDocument, buildMotiNotification, postMotiMessage } from './importer.ts'
import { getAttachments } from './gmail.ts'

interface ScanRequest {
  mode: 'full' | 'targeted'
  query?: string // for targeted mode
}

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
      },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!
  const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')!
  const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { mode, query } = (await req.json()) as ScanRequest
    const results: Array<{
      documentId: string
      title: string
      category: string
      amount: number | null
      currency: string | null
    }> = []

    // Get all connected email accounts
    const { data: accounts } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('is_approved', true)

    if (!accounts || accounts.length === 0) {
      return jsonResponse({ results: [], message: 'No connected email accounts' })
    }

    for (const account of accounts) {
      // Refresh access token
      let accessToken: string
      try {
        accessToken = await refreshAccessToken(
          account.refresh_token,
          googleClientId,
          googleClientSecret,
        )
      } catch (err) {
        console.warn(`Token refresh failed for ${account.email}:`, err)
        continue
      }

      // Build search query
      const searchQuery = mode === 'targeted' && query
        ? query
        : buildSearchQuery(account.last_scan_at)

      // Search emails
      const searchResults = await searchEmails(accessToken, searchQuery)
      if (!searchResults.messages?.length) continue

      // Process each message
      for (const { id: msgId } of searchResults.messages) {
        const message = await getMessage(accessToken, msgId)
        const from = getHeader(message, 'From')
        const subject = getHeader(message, 'Subject')
        const bodyText = getBodyText(message)

        // Pattern classification
        const patternResult = classifyByPattern(from, subject)
        if (patternResult === 'irrelevant') continue

        // Dedup check
        const isDuplicate = await isAlreadyImported(supabase, msgId, bodyText, subject)
        if (isDuplicate) continue

        // AI classification for uncertain emails
        if (patternResult === 'uncertain') {
          const aiResult = await classifyEmail(anthropicKey, subject, bodyText)
          if (!aiResult.category) continue
        }

        // Capture document (attachment or HTML)
        const captured = await captureDocument(accessToken, msgId, message)
        let fileUrl: string | null = null
        let fileType = 'text/html'
        let fileSize = 0

        if (captured) {
          fileUrl = await uploadToStorage(supabase, captured)
          fileType = captured.contentType
          fileSize = captured.data.length
        }

        // Extract metadata via AI
        const attachmentNames = getAttachments(message).map((a) => a.filename)
        const meta = await extractDocumentMeta(
          anthropicKey,
          subject,
          bodyText,
          from,
          attachmentNames,
        )

        // Import document
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
          sourceEmailId: msgId,
          expiryDate: meta.expiry_date,
          familyMemberId: meta.family_member_id,
        })

        results.push(result)
      }

      // Update last_scan_at
      await supabase
        .from('email_accounts')
        .update({ last_scan_at: new Date().toISOString() })
        .eq('id', account.id)
    }

    // Post Moti notification
    const motiMessage = buildMotiNotification(results)
    if (motiMessage) {
      await postMotiMessage(supabase, motiMessage)
    }

    return jsonResponse({
      results,
      message: results.length > 0
        ? `Found ${results.length} new documents`
        : 'No new documents found',
      motiMessage,
    })
  } catch (err) {
    console.error('Email scan error:', err)
    return jsonResponse({ error: String(err) }, 500)
  }
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/email-scan/index.ts
git commit -m "feat: email-scan edge function main handler"
```

---

## Chunk 4: OAuth Edge Function

### Task 10: OAuth callback handler

**Files:**
- Create: `supabase/functions/email-oauth/index.ts`

- [ ] **Step 1: Write OAuth handler**

```typescript
// supabase/functions/email-oauth/index.ts
// Handles Google OAuth callback: exchanges auth code for refresh token

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
      },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')!
  const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { code, redirect_uri, label } = await req.json()

    // Exchange auth code for tokens
    const tokenRes = await fetch(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      return new Response(JSON.stringify({ error: 'OAuth failed', details: err }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const tokens = await tokenRes.json()

    // Get user email from the access token
    const profileRes = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const profile = await profileRes.json()
    const email = profile.emailAddress

    // Store refresh token in email_accounts
    const { error } = await supabase.from('email_accounts').upsert({
      email,
      label: label || email.split('@')[0],
      refresh_token: tokens.refresh_token,
      is_approved: true,
    }, { onConflict: 'email' })

    if (error) throw error

    return new Response(JSON.stringify({ email, label: label || email.split('@')[0] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    console.error('OAuth error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/email-oauth/index.ts
git commit -m "feat: OAuth callback edge function for Gmail authorization"
```

---

## Chunk 5: Client-Side API & UI

### Task 11: Client-side email scan API

**Files:**
- Create: `src/lib/emailScan.ts`

- [ ] **Step 1: Write client API**

```typescript
// src/lib/emailScan.ts
// Client-side API for triggering email scans and managing accounts

import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

interface ScanResult {
  results: Array<{
    documentId: string
    title: string
    category: string
    amount: number | null
    currency: string | null
  }>
  message: string
  motiMessage?: string
}

export async function triggerEmailScan(mode: 'full' | 'targeted', query?: string): Promise<ScanResult> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${SUPABASE_URL}/functions/v1/email-scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    },
    body: JSON.stringify({ mode, query }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `Scan failed: ${res.status}`)
  }

  return res.json()
}

export function getGoogleOAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    access_type: 'offline',
    prompt: 'consent',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeOAuthCode(code: string, redirectUri: string, label?: string): Promise<{ email: string }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/email-oauth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    },
    body: JSON.stringify({ code, redirect_uri: redirectUri, label }),
  })

  if (!res.ok) throw new Error('OAuth exchange failed')
  return res.json()
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/emailScan.ts
git commit -m "feat: client-side email scan API"
```

---

### Task 12: Email Scan Button component

**Files:**
- Create: `src/modules/documents/components/EmailScanButton.tsx`

- [ ] **Step 1: Write the scan button component**

```typescript
// src/modules/documents/components/EmailScanButton.tsx

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { triggerEmailScan } from '@/lib/emailScan'

export function EmailScanButton() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleScan() {
    setScanning(true)
    setResult(null)
    try {
      const res = await triggerEmailScan('full')
      setResult({
        type: 'success',
        message: res.results.length > 0
          ? `נמצאו ${res.results.length} מסמכים חדשים!`
          : 'לא נמצאו מסמכים חדשים',
      })
    } catch (err) {
      setResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'שגיאה בסריקה',
      })
    } finally {
      setScanning(false)
      setTimeout(() => setResult(null), 5000)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleScan}
        disabled={scanning}
        className="flex items-center gap-1.5 rounded-xl bg-ios-indigo px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-ios-indigo/80 disabled:opacity-50"
      >
        {scanning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        {scanning ? 'סורק...' : 'סרוק אימייל'}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`absolute top-full left-0 right-0 mt-2 rounded-xl p-3 text-xs font-medium shadow-lg z-50 whitespace-nowrap ${
              result.type === 'success'
                ? 'bg-ios-green/10 text-ios-green border border-ios-green/20'
                : 'bg-ios-red/10 text-ios-red border border-ios-red/20'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {result.type === 'success' ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              )}
              {result.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Add scan button to Documents page header**

In `src/modules/documents/DocumentsPage.tsx`, import and add the button next to "העלה מסמך":

```typescript
import { EmailScanButton } from './components/EmailScanButton'

// In the header section, next to the Upload button:
<div className="flex items-center gap-2">
  <EmailScanButton />
  <Button onClick={() => setUploadOpen(true)}>
    <Plus className="h-4 w-4" />
    העלה מסמך
  </Button>
</div>
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/modules/documents/components/EmailScanButton.tsx src/modules/documents/DocumentsPage.tsx
git commit -m "feat: email scan button on Documents page"
```

---

### Task 13: Email Account Settings component

**Files:**
- Create: `src/modules/documents/components/EmailAccountSettings.tsx`

- [ ] **Step 1: Write the settings component**

```typescript
// src/modules/documents/components/EmailAccountSettings.tsx

import { useState, useEffect } from 'react'
import { Mail, Plus, Trash2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/cn'
import * as db from '@/lib/database'
import { getGoogleOAuthUrl } from '@/lib/emailScan'

interface EmailAccount {
  id: string
  email: string
  label: string
  is_approved: boolean
  last_scan_at: string | null
  created_at: string
}

export function EmailAccountSettings() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    db.fetchEmailAccounts().then(setAccounts)
  }, [])

  function handleConnect() {
    const redirectUri = `${window.location.origin}${import.meta.env.BASE_URL}oauth/callback`
    window.location.href = getGoogleOAuthUrl(redirectUri)
  }

  async function handleDisconnect(id: string) {
    await db.deleteEmailAccount(id)
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="glass rounded-apple-lg shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-right"
      >
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-ios-indigo" />
          <span className="text-sm font-semibold text-apple-primary">חשבונות אימייל מחוברים</span>
          <span className="text-xs text-apple-tertiary">({accounts.length})</span>
        </div>
        <span className={cn('text-apple-tertiary text-xs transition-transform', expanded && 'rotate-180')}>
          ▼
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-black/[0.04] pt-3 space-y-2">
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between rounded-lg border border-black/[0.06] px-3 py-2">
              <div>
                <p className="text-sm font-medium text-apple-primary">{account.label}</p>
                <p className="text-xs text-apple-secondary" dir="ltr">{account.email}</p>
                {account.last_scan_at && (
                  <p className="text-[10px] text-apple-tertiary">
                    סריקה אחרונה: {new Date(account.last_scan_at).toLocaleDateString('he-IL')}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDisconnect(account.id)}
                className="rounded-lg p-1.5 text-apple-tertiary hover:bg-ios-red/10 hover:text-ios-red"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <button
            onClick={handleConnect}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-black/[0.1] py-2.5 text-sm font-medium text-ios-indigo hover:bg-ios-indigo/5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            חבר חשבון Gmail
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add settings to Documents page**

In `src/modules/documents/DocumentsPage.tsx`, add below the category tabs:

```typescript
import { EmailAccountSettings } from './components/EmailAccountSettings'

// After the category tabs section:
<EmailAccountSettings />
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/documents/components/EmailAccountSettings.tsx src/modules/documents/DocumentsPage.tsx
git commit -m "feat: email account settings UI with connect/disconnect"
```

---

## Chunk 6: Moti Integration & Cron

### Task 14: Add SEARCH_EMAIL action to Moti bot engine

**Files:**
- Modify: `src/modules/chat/botEngine.ts`
- Modify: `src/contexts/AppDataContext.tsx`
- Modify: `supabase/functions/moti-chat/index.ts`

- [ ] **Step 1: Add SEARCH_EMAIL action type**

In `src/contexts/AppDataContext.tsx`, add to the `MotiAction` type:

```typescript
| { type: 'SEARCH_EMAIL'; query: string }
```

And add the handler in `executeMotiAction`:

```typescript
case 'SEARCH_EMAIL': {
  // Trigger targeted email scan — handled by the ChatPage
  return null
}
```

And add to `describeAction`:
```typescript
case 'SEARCH_EMAIL':
  return `חיפוש אימייל: ${action.query}`
```

- [ ] **Step 2: Add search_email tool to Edge Function**

In `supabase/functions/moti-chat/index.ts`, add to the TOOLS array:

```typescript
{
  name: 'search_email',
  description: 'Search connected Gmail accounts for a specific booking or document. Use when user asks to find a specific email or booking.',
  input_schema: {
    type: 'object' as const,
    properties: {
      query: { type: 'string', description: 'Search query describing what to find (e.g. "yellowstone campground reservation", "RV rental confirmation")' },
    },
    required: ['query'],
  },
},
```

- [ ] **Step 3: Add pattern detection in botEngine.ts**

In `src/modules/chat/botEngine.ts`, add to `parseActions` before the return:

```typescript
// ── Search email ──────────────────────────────────────────────────
// "תחפש/חפש/תמצא באימייל את..."
const searchEmailMatch = lower.match(
  /(?:תחפש|חפש|תמצא|מצא|תביא|הבא|תשלוף)\s+(?:באימייל|במייל|מהמייל|מאימייל|את\s+ה)?\s*(.+)/,
)
if (searchEmailMatch) {
  const query = searchEmailMatch[1].trim()
  if (query.length > 3) {
    actions.push({ type: 'SEARCH_EMAIL', query })
    return actions
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/contexts/AppDataContext.tsx src/modules/chat/botEngine.ts supabase/functions/moti-chat/index.ts
git commit -m "feat: add SEARCH_EMAIL action to Moti for targeted email search"
```

---

### Task 15: Set up pg_cron for automatic 6-hour scan

**Files:**
- Create: `supabase/migrations/006_email_scan_cron.sql`

- [ ] **Step 1: Write the cron migration**

```sql
-- supabase/migrations/006_email_scan_cron.sql
-- Schedule email scan every 6 hours via pg_cron + pg_net

-- Enable extensions (if not already)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the scan
SELECT cron.schedule(
  'email-scan-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/email-scan',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{"mode": "full"}'::jsonb
  );
  $$
);
```

Note: `pg_cron` and `pg_net` must be enabled in the Supabase dashboard (Database → Extensions). The `app.settings` vars need to be configured in Supabase project settings.

- [ ] **Step 2: Apply via Supabase dashboard SQL Editor**

Run the SQL in the Supabase dashboard. If pg_cron is not available on the free tier, document this as a manual step for when the project upgrades.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/006_email_scan_cron.sql
git commit -m "feat: pg_cron job for automatic 6-hour email scan"
```

---

## Chunk 7: Google Cloud Setup & Environment Variables

### Task 16: Google Cloud project configuration

This task is manual (not code):

- [ ] **Step 1: Create Google Cloud project** (or use existing)
  - Go to https://console.cloud.google.com
  - Create project or select existing one

- [ ] **Step 2: Enable Gmail API**
  - APIs & Services → Enable APIs → Search "Gmail API" → Enable

- [ ] **Step 3: Create OAuth consent screen**
  - OAuth consent screen → External → Fill in app name "Hey USA"
  - Add scope: `https://www.googleapis.com/auth/gmail.readonly`
  - Add test users: both Gmail addresses

- [ ] **Step 4: Create OAuth client ID**
  - Credentials → Create Credentials → OAuth client ID
  - Application type: Web application
  - Authorized redirect URIs: `https://shanimosco47-pixel.github.io/hey-usa/oauth/callback`
  - Save Client ID and Client Secret

- [ ] **Step 5: Set environment variables in Supabase**
  - Project Settings → Edge Functions → Add secrets:
    - `GOOGLE_CLIENT_ID` = (from step 4)
    - `GOOGLE_CLIENT_SECRET` = (from step 4)
    - `ANTHROPIC_API_KEY` = (already set for moti-chat)

- [ ] **Step 6: Add VITE_GOOGLE_CLIENT_ID to app**
  - Add to `.env.local`: `VITE_GOOGLE_CLIENT_ID=<client-id>`
  - Add to `.github/workflows/deploy.yml` env vars

- [ ] **Step 7: Deploy Edge Functions**
  ```bash
  supabase functions deploy email-scan
  supabase functions deploy email-oauth
  ```

---

## Chunk 8: OAuth Callback Route & Final Wiring

### Task 17: OAuth callback page

**Files:**
- Create: `src/modules/auth/OAuthCallbackPage.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create OAuth callback page**

```typescript
// src/modules/auth/OAuthCallbackPage.tsx

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { exchangeOAuthCode } from '@/lib/emailScan'

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) {
      setStatus('error')
      setMessage('Missing authorization code')
      return
    }

    const redirectUri = `${window.location.origin}${import.meta.env.BASE_URL}oauth/callback`
    exchangeOAuthCode(code, redirectUri)
      .then((res) => {
        setStatus('success')
        setMessage(`חשבון ${res.email} חובר בהצלחה!`)
        setTimeout(() => navigate('/documents'), 2000)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message)
      })
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary" dir="rtl">
      <div className="text-center space-y-4">
        {status === 'loading' && <Loader2 className="h-10 w-10 animate-spin text-ios-blue mx-auto" />}
        {status === 'success' && <CheckCircle2 className="h-10 w-10 text-ios-green mx-auto" />}
        {status === 'error' && <AlertCircle className="h-10 w-10 text-ios-red mx-auto" />}
        <p className="text-lg font-medium text-apple-primary">
          {status === 'loading' ? 'מחבר חשבון Gmail...' : message}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add route to App.tsx**

Add the lazy import and route:
```typescript
const OAuthCallbackPage = lazy(() => import('@/modules/auth/OAuthCallbackPage'))

// Inside Routes, before the catch-all:
<Route path="oauth/callback" element={<OAuthCallbackPage />} />
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/modules/auth/OAuthCallbackPage.tsx src/App.tsx
git commit -m "feat: OAuth callback page for Gmail authorization flow"
```

---

### Task 18: Handle SEARCH_EMAIL in ChatPage

**Files:**
- Modify: `src/modules/chat/ChatPage.tsx`

- [ ] **Step 1: Add SEARCH_EMAIL handler**

In the ChatPage's action execution logic (where it processes `MotiAction` results), add handling for `SEARCH_EMAIL`:

```typescript
// When action.type === 'SEARCH_EMAIL':
import { triggerEmailScan } from '@/lib/emailScan'

// Inside the action handler:
if (action.type === 'SEARCH_EMAIL') {
  try {
    const result = await triggerEmailScan('targeted', action.query)
    // The Edge Function posts the Moti notification directly
    // Refresh the chat messages to show the notification
  } catch (err) {
    // Add error message to chat
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/chat/ChatPage.tsx
git commit -m "feat: handle SEARCH_EMAIL action in ChatPage"
```

---

### Task 19: Final integration test & deploy

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Deploy Edge Functions**

```bash
supabase functions deploy email-scan
supabase functions deploy email-oauth
```

- [ ] **Step 4: Push to deploy app**

```bash
git push origin master
```

- [ ] **Step 5: Test end-to-end**

1. Open the app → Documents → Click "חבר חשבון Gmail"
2. Approve Google OAuth consent
3. Verify account appears in settings
4. Click "סרוק אימייל" button
5. Verify documents are imported
6. Check Moti chat for notification
7. Ask Moti: "תחפש את ההזמנה של הקרוואן" — verify targeted search works

---

## Summary

| Chunk | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-2 | Database schema + types |
| 2 | 3-6 | Edge Function modules: Gmail API, patterns, dedup, classifier |
| 3 | 7-9 | Edge Function modules: capture, importer, main handler |
| 4 | 10 | OAuth Edge Function |
| 5 | 11-13 | Client-side API + UI components |
| 6 | 14-15 | Moti integration + cron |
| 7 | 16 | Google Cloud setup (manual) |
| 8 | 17-19 | OAuth callback, ChatPage wiring, deploy |

Total: 19 tasks across 8 chunks.
