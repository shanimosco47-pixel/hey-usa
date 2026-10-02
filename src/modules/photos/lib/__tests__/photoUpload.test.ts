import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: null }))

import {
  isHeic,
  isInlinePhotoUrl,
  moveInlinePhotoToStorage,
  safeStorageName,
  storagePath,
  runPool,
} from '../photoUpload'

describe('isHeic', () => {
  it('detects HEIC/HEIF by type or extension', () => {
    expect(isHeic({ name: 'IMG_1.HEIC', type: '' })).toBe(true)
    expect(isHeic({ name: 'x', type: 'image/heif' })).toBe(true)
    expect(isHeic({ name: 'IMG_1.jpg', type: 'image/jpeg' })).toBe(false)
  })
})

describe('safeStorageName', () => {
  it('keeps storage keys ASCII-safe, including Hebrew and spaces', () => {
    expect(safeStorageName('תמונה משותפת.jpg')).toBe('photo.jpg')
    expect(safeStorageName('IMG 2034 (1).JPG')).toBe('IMG-2034-1.jpg')
    expect(safeStorageName('../../etc/passwd')).toBe('etc-passwd.jpg')
  })

  it('uses the extension of the uploaded bytes, not the original name', () => {
    expect(safeStorageName('IMG_1.HEIC')).toBe('IMG_1.jpg')
    expect(safeStorageName('shot.png', 'image/png')).toBe('shot.png')
  })

  it('stores under trip/ with a unique prefix', () => {
    const a = storagePath('a.jpg')
    expect(a).toMatch(/^trip\/\d+-[a-z0-9]+-a\.jpg$/)
    expect(storagePath('a.jpg')).not.toBe(a)
  })
})

describe('runPool', () => {
  it('never exceeds the concurrency limit and keeps result order', async () => {
    let running = 0
    let peak = 0
    const out = await runPool([30, 5, 20, 1, 10, 2], 3, async (ms, i) => {
      running++
      peak = Math.max(peak, running)
      await new Promise((r) => setTimeout(r, ms))
      running--
      return i
    })
    expect(peak).toBe(3)
    expect(out).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('handles an empty list', async () => {
    expect(await runPool([], 3, async () => 1)).toEqual([])
  })
})

describe('moveInlinePhotoToStorage', () => {
  const dataUrl = `data:image/jpeg;base64,${btoa('fake-jpeg-bytes')}`

  it('uploads the decoded bytes and returns the storage URL', async () => {
    let uploaded: Blob | undefined
    const url = await moveInlinePhotoToStorage({ id: 'photo-1', url: dataUrl }, async (blob) => {
      uploaded = blob
      return 'https://x.supabase.co/storage/v1/object/public/photos/trip/a.jpg'
    })
    expect(url).toMatch(/^https:\/\//)
    expect(uploaded?.size).toBe('fake-jpeg-bytes'.length)
  })

  it('refuses rows that are not inline photos and surfaces upload failures', async () => {
    const never = async () => 'x'
    await expect(
      moveInlinePhotoToStorage({ id: 'p', url: 'https://a/b.jpg' }, never),
    ).rejects.toThrow()
    await expect(
      moveInlinePhotoToStorage({ id: 'p', url: dataUrl }, async () => {
        throw new Error('storage down')
      }),
    ).rejects.toThrow('storage down')
  })

  it('recognises only image data URLs as inline photos', () => {
    expect(isInlinePhotoUrl(dataUrl)).toBe(true)
    expect(isInlinePhotoUrl('data:text/html,<b>x</b>')).toBe(false)
    expect(isInlinePhotoUrl('https://x/y.jpg')).toBe(false)
    expect(isInlinePhotoUrl(undefined)).toBe(false)
  })
})
