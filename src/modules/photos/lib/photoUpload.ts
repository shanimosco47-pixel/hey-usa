import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'
import { retryWithBackoff } from '@/lib/retry'
import { localDb, type PendingPhotoUpload } from '@/lib/db'
import type { FamilyMemberId, ItineraryDay, Photo } from '@/lib/types'
import { readPhotoMetadata, findTripDay } from './photoMetadata'

export type NewPhoto = Omit<Photo, 'id' | 'created_at'>

export class UnsupportedPhotoError extends Error {}

export function isHeic(file: Pick<File, 'name' | 'type'>): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
}

/**
 * Storage object keys reject some characters, and phones hand over names like
 * "image.jpg" or Hebrew album names. Keep ASCII letters, digits, dot, dash.
 */
export function safeStorageName(name: string, mime = 'image/jpeg'): string {
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
  const cleaned = name
    .replace(/\.[A-Za-z0-9]{1,5}$/, '')
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return `${cleaned || 'photo'}.${ext}`
}

export function storagePath(fileName: string, mime?: string): string {
  return `trip/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeStorageName(fileName, mime)}`
}

async function compress(file: File): Promise<Blob> {
  try {
    return await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1600,
      useWebWorker: false, // WebWorker can fail under strict CSP
    })
  } catch (err) {
    // A HEIC the browser cannot decode would be stored as a file nobody can view
    if (isHeic(file)) {
      throw new UnsupportedPhotoError('HEIC')
    }
    console.warn('Image compression failed, using original file:', err)
    return file
  }
}

/** Read when/where the photo was taken, then shrink it for upload. */
export async function preparePhoto(
  file: File,
  ctx: { member: FamilyMemberId; days: Pick<ItineraryDay, 'id' | 'date' | 'city'>[] },
): Promise<{ blob: Blob; photo: NewPhoto }> {
  // Metadata first: compression strips EXIF
  const meta = await readPhotoMetadata(file)
  const blob = await compress(file)
  const day = findTripDay(meta.localDate, ctx.days)
  const photo: NewPhoto = {
    url: '',
    caption: '',
    taken_by: ctx.member,
    day_id: day?.id,
    location: day?.city || '',
    lat: meta.lat,
    lng: meta.lng,
    tags: [],
    is_favorite: false,
    taken_at: meta.takenAt ?? new Date().toISOString(),
  }
  return { blob, photo }
}

/** Upload to the shared photos bucket and return its public URL. Throws on failure. */
export async function uploadToStorage(blob: Blob, fileName: string): Promise<string> {
  const sb = supabase
  if (!sb) throw new Error('Supabase is not configured')
  const path = storagePath(fileName, blob.type)
  const { data } = await retryWithBackoff(async () => {
    const result = await sb.storage
      .from('photos')
      .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false })
    if (result.error) throw result.error
    return result
  }, 2)
  return sb.storage.from('photos').getPublicUrl(data.path).data.publicUrl
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// ─── Upload queue (IndexedDB) ────────────────────────────────────────

export async function queuePendingUpload(
  blob: Blob,
  fileName: string,
  photo: NewPhoto,
): Promise<string> {
  const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const record: PendingPhotoUpload = {
    id,
    blob,
    file_name: fileName,
    photo,
    created_at: new Date().toISOString(),
    attempts: 0,
  }
  await localDb.pendingPhotoUploads.put(record)
  return id
}

export async function markPendingFailed(id: string, err: unknown): Promise<void> {
  const rec = await localDb.pendingPhotoUploads.get(id)
  if (!rec) return
  await localDb.pendingPhotoUploads.put({
    ...rec,
    attempts: rec.attempts + 1,
    last_error: err instanceof Error ? err.message : String(err),
  })
}

export function listPendingUploads(): Promise<PendingPhotoUpload[]> {
  return localDb.pendingPhotoUploads.orderBy('created_at').toArray()
}

export function removePendingUpload(id: string): Promise<void> {
  return localDb.pendingPhotoUploads.delete(id)
}

/** Run `worker` over items with at most `limit` in flight. Results keep input order. */
export async function runPool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  const lanes = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await worker(items[i], i)
    }
  })
  await Promise.all(lanes)
  return results
}
