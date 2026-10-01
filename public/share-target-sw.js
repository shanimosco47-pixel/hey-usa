/* global self, caches, Response, URL */
// Android "Share → Hey USA" (Web Share Target, installed PWA only).
// Loaded into the generated service worker via workbox.importScripts, so it
// registers its fetch listener before Workbox's routes. It only touches the
// POST to /hey-usa/share-target; every other request falls through.
// Keep SHARE_CACHE / SHARE_KEY_PREFIX in sync with src/modules/photos/lib/sharedFiles.ts.

const SHARE_ACTION = '/hey-usa/share-target'
const SHARE_CACHE = 'hey-usa-share-target'
const SHARE_KEY_PREFIX = '/hey-usa/__shared/'
const PHOTOS_PAGE = '/hey-usa/photos'

async function receiveShare(request) {
  try {
    const form = await request.formData()
    const files = form.getAll('photos').filter((f) => f && typeof f !== 'string')
    if (files.length > 0) {
      const cache = await caches.open(SHARE_CACHE)
      const batch = Date.now()
      await Promise.all(
        files.map((file, i) =>
          cache.put(
            new URL(`${SHARE_KEY_PREFIX}${batch}-${i}`, self.location.origin).href,
            new Response(file, {
              headers: {
                'Content-Type': file.type || 'image/jpeg',
                'X-File-Name': encodeURIComponent(file.name || `shared-${i}.jpg`),
              },
            }),
          ),
        ),
      )
    }
    return Response.redirect(`${PHOTOS_PAGE}?shared=${files.length}`, 303)
  } catch (err) {
    console.error('[share-target] Could not receive shared photos:', err)
    return Response.redirect(`${PHOTOS_PAGE}?shared=error`, 303)
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'POST') return
  if (new URL(request.url).pathname !== SHARE_ACTION) return
  event.respondWith(receiveShare(request))
})
