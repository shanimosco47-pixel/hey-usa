import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import exifr from 'exifr/dist/lite.esm.mjs'
import { ITINERARY_DAYS } from '@/data/itinerary'
import { FAMILY_MEMBERS_LIST } from '@/constants'
import { parseExifDateTime as appParse } from '@/modules/photos/lib/photoMetadata'
import {
  TRIP_DAYS,
  FAMILY_MEMBERS,
  buildPhotoRow,
  isMember,
  parseExifDateTime,
  sniffImage,
} from '../logic'

const FIXTURES = path.resolve(__dirname, '../../../../src/modules/photos/lib/__tests__/fixtures')
const NOW = '2026-10-01T12:00:00.000Z'

describe('photo-inbox stays in sync with the app', () => {
  it('has the same day ids, dates and cities as the itinerary', () => {
    expect(TRIP_DAYS).toEqual(ITINERARY_DAYS.map((d) => ({ id: d.id, date: d.date, city: d.city })))
  })

  it('accepts exactly the human family members', () => {
    expect([...FAMILY_MEMBERS].sort()).toEqual(
      FAMILY_MEMBERS_LIST.map((m) => m.id)
        .filter((id) => id !== 'moti')
        .sort(),
    )
  })

  it('parses EXIF dates the same way as the app', () => {
    for (const [raw, off] of [
      ['2026:09:25 18:42:10', '-07:00'],
      ['2026:09:10 23:55:00', undefined],
      ['2025:01:01 10:00:00', undefined],
      ['0000:00:00 00:00:00', undefined],
    ] as const) {
      expect(parseExifDateTime(raw, off)).toEqual(appParse(raw, off))
    }
  })
})

describe('isMember', () => {
  it('rejects unknown and non-string members', () => {
    expect(isMember('ima')).toBe(true)
    expect(isMember('moti')).toBe(false)
    expect(isMember('')).toBe(false)
    expect(isMember(null)).toBe(false)
  })
})

describe('sniffImage', () => {
  it('recognises JPEG, PNG and HEIC by their bytes', () => {
    const jpg = new Uint8Array(readFileSync(path.join(FIXTURES, 'yosemite-exif.jpg')))
    expect(sniffImage(jpg)).toBe('jpeg')
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe('png')
    const heic = new Uint8Array([0, 0, 0, 0x18, ...[...'ftypheic'].map((c) => c.charCodeAt(0))])
    expect(sniffImage(heic)).toBe('heic')
    expect(sniffImage(new TextEncoder().encode('<html>not a photo</html>'))).toBeNull()
  })
})

describe('buildPhotoRow', () => {
  it('fills capture time, GPS and trip day from a real JPEG', async () => {
    // Same input type the edge function passes (Uint8Array of the upload)
    const jpg = new Uint8Array(readFileSync(path.join(FIXTURES, 'yosemite-exif.jpg')))
    const tags = await exifr.parse(jpg, { gps: true, reviveValues: false })
    const row = buildPhotoRow({
      id: 'photo-1',
      url: 'https://x/p.jpg',
      member: 'ima',
      tags,
      now: NOW,
    })
    expect(row).toMatchObject({
      id: 'photo-1',
      taken_by: 'ima',
      taken_at: '2026-09-25T18:42:10-07:00',
      day_id: 'day-16',
      location: 'Yosemite Valley',
      is_favorite: false,
      created_at: NOW,
    })
    expect(row.lat).toBeCloseTo(37.7459, 3)
    expect(row.lng).toBeCloseTo(-119.5332, 3)
  })

  it('falls back to now with no day when the photo has no EXIF', () => {
    const row = buildPhotoRow({ id: 'p', url: 'u', member: 'aba', tags: undefined, now: NOW })
    expect(row).toMatchObject({ taken_at: NOW, day_id: null, location: null, lat: null, lng: null })
  })

  it('drops half a GPS pair rather than storing a wrong location', () => {
    const row = buildPhotoRow({
      id: 'p',
      url: 'u',
      member: 'aba',
      tags: { latitude: 37.1 },
      now: NOW,
    })
    expect(row.lat).toBeNull()
    expect(row.lng).toBeNull()
  })
})
