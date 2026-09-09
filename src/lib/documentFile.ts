import { retryWithBackoff } from '@/lib/retry'
import type { Document } from '@/types'

/**
 * Whether a document's file_url points to a real, loadable file.
 *
 * Only absolute http(s) URLs (Supabase Storage) and data: URIs are real uploads.
 * Sample/seed documents carry placeholder paths like "/documents/zion-shuttle.pdf"
 * that don't exist — loading one resolves against the app host and returns the
 * GitHub Pages 404 page, so these must never be previewed or linked as files.
 */
export function hasRealFile(doc: Pick<Document, 'file_url'>): boolean {
  const url = doc.file_url
  if (!url) return false
  return url.startsWith('http') || url.startsWith('data:')
}

/**
 * Whether a document should be rendered as HTML.
 *
 * Email captures are stored as .html in Supabase Storage, but the stored
 * content type isn't always trustworthy (some captures land as text/plain or
 * application/octet-stream), so the file extension is checked as well.
 */
export function isHtmlDocument(doc: Pick<Document, 'file_type' | 'file_url'>): boolean {
  if (doc.file_type?.includes('html')) return true
  const path = doc.file_url?.split(/[?#]/)[0].toLowerCase() ?? ''
  return path.endsWith('.html') || path.endsWith('.htm')
}

/**
 * Downloads an HTML file and re-publishes it as a blob URL with an explicit
 * text/html type. Supabase Storage serves user-uploaded HTML as plain text, so
 * pointing the browser straight at the public URL shows the raw markup instead
 * of the rendered reservation. The caller owns the returned URL and should
 * revoke it when done.
 */
export async function fetchHtmlAsBlobUrl(url: string): Promise<string> {
  return htmlToBlobUrl(await fetchHtmlText(url))
}

/** Downloads the raw markup of an HTML document, retrying transient failures. */
export async function fetchHtmlText(url: string): Promise<string> {
  return retryWithBackoff(() =>
    fetch(url).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.text()
    }),
  )
}

/** Wraps markup in a blob URL the browser will render as HTML. */
export function htmlToBlobUrl(html: string): string {
  return URL.createObjectURL(new Blob([html], { type: 'text/html' }))
}

/**
 * Opens a document's file in a new tab, rendering HTML captures instead of
 * dumping their source. The tab is opened synchronously so mobile browsers
 * don't treat it as a blocked popup, then pointed at the blob once it's ready.
 */
export async function openDocumentFile(doc: Pick<Document, 'file_type' | 'file_url'>) {
  if (!hasRealFile(doc)) return
  const url = doc.file_url!
  if (!isHtmlDocument(doc)) {
    window.open(url, '_blank', 'noopener')
    return
  }
  const tab = window.open('', '_blank')
  if (tab) tab.opener = null
  try {
    const blobUrl = await fetchHtmlAsBlobUrl(url)
    if (tab) tab.location.replace(blobUrl)
    else window.open(blobUrl, '_blank', 'noopener')
  } catch {
    // Couldn't fetch it (offline, CORS) — fall back to the raw file
    if (tab) tab.location.replace(url)
    else window.open(url, '_blank', 'noopener')
  }
}
