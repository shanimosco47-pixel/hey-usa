// Supabase Edge Function — photo inbox for the iPhone Shortcut.
// iOS has no Web Share Target, so an iPhone shares photos to a Shortcut that
// POSTs each one here (multipart: photo=<file>, member=<aba|ima|kid1..3>).
// The photo goes to the public `photos` bucket and a row is added to `photos`,
// with capture time, GPS and trip day read from the file's EXIF.
// Auth: the caller sends the app's public Supabase key (legacy anon JWT or the
// newer sb_publishable_ key) in the `apikey` header. verify_jwt is off because a
// publishable key is not a JWT; instead the key is checked against this project.

import { createClient } from 'npm:@supabase/supabase-js@2'
import exifr from 'npm:exifr@7.1.3/dist/lite.esm.mjs'
import { MAX_PHOTO_BYTES, buildPhotoRow, isMember, sniffImage } from './logic.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  })
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!

/** True when `key` is a valid public key of this project (any key type). */
async function isProjectKey(key: string): Promise<boolean> {
  const headers: Record<string, string> = { apikey: key }
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/photos?select=id&limit=0`, { headers })
    await res.body?.cancel()
    return res.ok
  } catch {
    return false
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return reply(405, { ok: false, error: 'POST only' })

  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const key = (req.headers.get('apikey') || bearer || '').trim()
  if (!key || !(await isProjectKey(key))) {
    return reply(401, { ok: false, error: 'Missing or invalid apikey header' })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return reply(400, { ok: false, error: 'Expected multipart/form-data' })
  }

  const member = String(form.get('member') ?? '')
    .trim()
    .toLowerCase()
  if (!isMember(member)) {
    return reply(400, { ok: false, error: 'member must be one of aba, ima, kid1, kid2, kid3' })
  }

  const file = form.get('photo')
  if (!file || typeof file === 'string') {
    return reply(400, { ok: false, error: 'Missing photo file field' })
  }
  if (file.size === 0 || file.size > MAX_PHOTO_BYTES) {
    return reply(413, { ok: false, error: 'Photo must be between 1 byte and 20MB' })
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const kind = sniffImage(bytes)
  if (kind === 'heic') {
    // Browsers other than Safari cannot show HEIC; the Shortcut converts to JPEG first
    return reply(415, { ok: false, error: 'HEIC not accepted: convert to JPEG in the Shortcut' })
  }
  if (!kind) return reply(415, { ok: false, error: 'Only JPEG or PNG photos are accepted' })

  let tags = null
  try {
    tags = await exifr.parse(bytes, { gps: true, reviveValues: false })
  } catch (err) {
    console.warn('[photo-inbox] EXIF read failed:', err)
  }

  const sb = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const stamp = Date.now()
  const rand = Math.random().toString(36).slice(2, 8)
  const ext = kind === 'png' ? 'png' : 'jpg'
  const path = `trip/${stamp}-${rand}-iphone.${ext}`

  const up = await sb.storage.from('photos').upload(path, bytes, {
    contentType: kind === 'png' ? 'image/png' : 'image/jpeg',
    upsert: false,
  })
  if (up.error) {
    console.error('[photo-inbox] Storage upload failed:', up.error)
    return reply(502, { ok: false, error: 'Storage upload failed' })
  }
  const url = sb.storage.from('photos').getPublicUrl(up.data.path).data.publicUrl

  const row = buildPhotoRow({
    id: `photo-${stamp}-${rand}`,
    url,
    member,
    tags,
    now: new Date().toISOString(),
  })
  const ins = await sb.from('photos').insert(row)
  if (ins.error) {
    console.error('[photo-inbox] Row insert failed:', ins.error)
    // Do not leave a file that no row points to
    await sb.storage.from('photos').remove([up.data.path])
    return reply(500, { ok: false, error: 'Saving the photo failed' })
  }

  return reply(200, { ok: true, id: row.id, day_id: row.day_id, taken_at: row.taken_at })
})
