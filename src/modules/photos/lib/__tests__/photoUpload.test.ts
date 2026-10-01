import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: null }))

import { isHeic, safeStorageName, storagePath, runPool } from '../photoUpload'

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
