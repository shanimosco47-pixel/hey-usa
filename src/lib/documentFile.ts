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
