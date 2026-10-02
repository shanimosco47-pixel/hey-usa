/**
 * Android "Share → Hey USA": the service worker (public/share-target-sw.js)
 * receives the shared photos as a POST, parks them in this cache and
 * redirects to /photos?shared=1. The page then takes them out of the cache.
 * Keep these names in sync with share-target-sw.js.
 */
export const SHARE_CACHE = 'hey-usa-share-target'
export const SHARE_KEY_PREFIX = '/hey-usa/__shared/'

let inProgress: Promise<File[]> | null = null

/**
 * Take every file waiting from a share. Each file is removed once read.
 * Concurrent callers share one read, so a file is never handed out twice.
 */
export function consumeSharedFiles(): Promise<File[]> {
  if (inProgress) return inProgress.then(() => [])
  inProgress = readAndClear().finally(() => {
    inProgress = null
  })
  return inProgress
}

async function readAndClear(): Promise<File[]> {
  if (typeof caches === 'undefined') return []
  try {
    if (!(await caches.has(SHARE_CACHE))) return []
    const cache = await caches.open(SHARE_CACHE)
    const files: File[] = []
    for (const req of await cache.keys()) {
      if (!new URL(req.url).pathname.startsWith(SHARE_KEY_PREFIX)) continue
      const res = await cache.match(req)
      if (res) {
        const blob = await res.blob()
        const name = decodeURIComponent(res.headers.get('X-File-Name') || 'shared.jpg')
        files.push(new File([blob], name, { type: blob.type || 'image/jpeg' }))
      }
      await cache.delete(req)
    }
    return files
  } catch (err) {
    console.warn('[photos] Could not read shared files:', err)
    return []
  }
}
