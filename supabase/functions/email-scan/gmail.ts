// gmail.ts — Gmail API v1 REST client for Deno Edge Functions

export interface GmailMessageHeader {
  name: string
  value: string
}

export interface GmailMessagePart {
  partId?: string
  mimeType?: string
  filename?: string
  headers?: GmailMessageHeader[]
  body?: {
    attachmentId?: string
    size?: number
    data?: string
  }
  parts?: GmailMessagePart[]
}

export interface GmailMessage {
  id: string
  threadId: string
  labelIds?: string[]
  snippet?: string
  historyId?: string
  internalDate?: string
  payload?: GmailMessagePart
  sizeEstimate?: number
  raw?: string
}

export interface GmailSearchResult {
  messages?: { id: string; threadId: string }[]
  nextPageToken?: string
  resultSizeEstimate: number
}

export interface GmailAttachmentMeta {
  filename: string
  mimeType: string
  attachmentId: string
  size: number
  /**
   * True when the part is embedded in the message body rather than attached to
   * it: a logo, a signature image, a tracking pixel. Senders mark these with a
   * Content-ID (so the HTML can reference them as cid:...) or an explicit
   * inline disposition.
   */
  inline: boolean
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token refresh failed (${res.status}): ${err}`)
  }

  const json = await res.json()
  if (!json.access_token) {
    throw new Error('Token refresh response missing access_token')
  }
  return json.access_token as string
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function searchEmails(
  accessToken: string,
  query: string,
  maxResults = 100,
  pageToken?: string,
): Promise<GmailSearchResult> {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
  })
  if (pageToken) params.set('pageToken', pageToken)

  const res = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gmail search failed (${res.status}): ${err}`)
  }

  return (await res.json()) as GmailSearchResult
}

/**
 * Searches every page of results, not just the first.
 *
 * Gmail returns newest-first, so a single un-paginated page silently drops the
 * oldest matches. That is exactly the wrong end: confirmations are booked
 * months ahead, while the recent end of the window is mostly airline and
 * campground marketing. Without this, a mailbox with more than one page of
 * matches loses the real bookings and keeps the newsletters.
 *
 * Bounded by maxPages so one noisy mailbox cannot run the function out of time.
 */
export async function searchAllEmails(
  accessToken: string,
  query: string,
  maxPages = 6,
  pageSize = 100,
): Promise<{ messages: { id: string; threadId: string }[]; truncated: boolean }> {
  const messages: { id: string; threadId: string }[] = []
  let pageToken: string | undefined

  for (let page = 0; page < maxPages; page++) {
    const result = await searchEmails(accessToken, query, pageSize, pageToken)
    messages.push(...(result.messages ?? []))
    pageToken = result.nextPageToken
    if (!pageToken) return { messages, truncated: false }
  }

  // Ran out of pages with more still available.
  return { messages, truncated: true }
}

// ---------------------------------------------------------------------------
// Get full message
// ---------------------------------------------------------------------------

export async function getMessage(accessToken: string, messageId: string): Promise<GmailMessage> {
  const res = await fetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`getMessage failed (${res.status}): ${err}`)
  }

  return (await res.json()) as GmailMessage
}

// ---------------------------------------------------------------------------
// Get attachment data
// ---------------------------------------------------------------------------

export async function getAttachment(
  accessToken: string,
  messageId: string,
  attachmentId: string,
): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`getAttachment failed (${res.status}): ${err}`)
  }

  const json = await res.json()
  return json.data as string
}

// ---------------------------------------------------------------------------
// Header helpers
// ---------------------------------------------------------------------------

export function getHeader(msg: GmailMessage, name: string): string {
  const lowerName = name.toLowerCase()
  const headers = msg.payload?.headers ?? []
  const found = headers.find((h) => h.name.toLowerCase() === lowerName)
  return found?.value ?? ''
}

// ---------------------------------------------------------------------------
// Body extraction
// ---------------------------------------------------------------------------

function decodeBase64Url(data: string): string {
  try {
    return atob(data.replace(/-/g, '+').replace(/_/g, '/'))
  } catch {
    return ''
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function collectParts(part: GmailMessagePart): GmailMessagePart[] {
  const results: GmailMessagePart[] = [part]
  if (part.parts) {
    for (const child of part.parts) {
      results.push(...collectParts(child))
    }
  }
  return results
}

export function getBodyText(msg: GmailMessage): string {
  if (!msg.payload) return ''

  const allParts = collectParts(msg.payload)

  // Prefer explicit text/plain
  for (const part of allParts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      return decodeBase64Url(part.body.data)
    }
  }

  // Fallback: strip HTML from text/html part
  for (const part of allParts) {
    if (part.mimeType === 'text/html' && part.body?.data) {
      return stripHtml(decodeBase64Url(part.body.data))
    }
  }

  // Last resort: snippet
  return msg.snippet ?? ''
}

export function getBodyHtml(msg: GmailMessage): string | null {
  if (!msg.payload) return null

  const allParts = collectParts(msg.payload)

  for (const part of allParts) {
    if (part.mimeType === 'text/html' && part.body?.data) {
      return decodeBase64Url(part.body.data)
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Attachment listing
// ---------------------------------------------------------------------------

export function getAttachments(msg: GmailMessage): GmailAttachmentMeta[] {
  if (!msg.payload) return []

  const allParts = collectParts(msg.payload)
  const results: GmailAttachmentMeta[] = []

  for (const part of allParts) {
    if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
      const headers = part.headers ?? []
      const header = (name: string) =>
        headers.find((h) => h.name.toLowerCase() === name)?.value?.toLowerCase() ?? ''

      results.push({
        filename: part.filename,
        mimeType: part.mimeType ?? 'application/octet-stream',
        attachmentId: part.body.attachmentId,
        size: part.body.size ?? 0,
        inline: header('content-id') !== '' || header('content-disposition').startsWith('inline'),
      })
    }
  }

  return results
}
