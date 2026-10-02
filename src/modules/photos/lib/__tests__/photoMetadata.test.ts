import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { ITINERARY_DAYS } from '@/data/itinerary'
import { parseExifDateTime, readPhotoMetadata, findTripDay, tripUtcOffset } from '../photoMetadata'

function fixture(name: string): Blob {
  const buf = readFileSync(path.join(__dirname, 'fixtures', name))
  return new Blob([buf], { type: 'image/jpeg' })
}

describe('parseExifDateTime', () => {
  it('keeps the camera offset when present', () => {
    expect(parseExifDateTime('2026:09:25 18:42:10', '-07:00')).toEqual({
      localDate: '2026-09-25',
      takenAt: '2026-09-25T18:42:10-07:00',
    })
  })

  it('falls back to the trip timezone for that date when no offset was written', () => {
    expect(parseExifDateTime('2026:09:10 23:55:00')).toEqual({
      localDate: '2026-09-10',
      takenAt: '2026-09-10T23:55:00-04:00',
    })
    expect(parseExifDateTime('2026:09:15 08:00:00')?.takenAt).toBe('2026-09-15T08:00:00-06:00')
  })

  it('keeps only the date outside the trip when no offset is known', () => {
    expect(parseExifDateTime('2025:12:31 10:00:00')).toEqual({ localDate: '2025-12-31' })
  })

  it('rejects empty, malformed and zeroed dates', () => {
    expect(parseExifDateTime(undefined)).toBeNull()
    expect(parseExifDateTime('not a date')).toBeNull()
    expect(parseExifDateTime('0000:00:00 00:00:00')).toBeNull()
  })

  it('ignores a malformed offset instead of producing an invalid timestamp', () => {
    expect(parseExifDateTime('2026:09:25 18:42:10', 'PDT')?.takenAt).toBe(
      '2026-09-25T18:42:10-07:00',
    )
  })
})

describe('tripUtcOffset', () => {
  it('covers every trip day and nothing outside it', () => {
    for (const day of ITINERARY_DAYS) expect(tripUtcOffset(day.date)).toBeDefined()
    expect(tripUtcOffset('2026-09-09')).toBeUndefined()
    expect(tripUtcOffset('2026-10-01')).toBeUndefined()
  })
})

describe('readPhotoMetadata', () => {
  it('reads capture time and GPS from a real JPEG', async () => {
    const meta = await readPhotoMetadata(fixture('yosemite-exif.jpg'))
    expect(meta.localDate).toBe('2026-09-25')
    expect(meta.takenAt).toBe('2026-09-25T18:42:10-07:00')
    expect(meta.lat).toBeCloseTo(37.7459, 3)
    expect(meta.lng).toBeCloseTo(-119.5332, 3)
  })

  it('reads the date when GPS and offset are missing', async () => {
    const meta = await readPhotoMetadata(fixture('no-offset-no-gps.jpg'))
    expect(meta).toEqual({ localDate: '2026-09-10', takenAt: '2026-09-10T23:55:00-04:00' })
  })

  it('returns nothing (and does not throw) for a photo without EXIF or a non-image', async () => {
    expect(await readPhotoMetadata(fixture('no-exif.jpg'))).toEqual({})
    expect(await readPhotoMetadata(new Blob(['hello'], { type: 'text/plain' }))).toEqual({})
  })
})

describe('findTripDay', () => {
  it('matches the itinerary day by the photo local date', () => {
    expect(findTripDay('2026-09-25', ITINERARY_DAYS)?.id).toBe('day-16')
    expect(findTripDay('2026-09-10', ITINERARY_DAYS)?.id).toBe('day-1')
  })

  it('does not match outside the trip or without a date', () => {
    expect(findTripDay('2026-10-01', ITINERARY_DAYS)).toBeUndefined()
    expect(findTripDay(undefined, ITINERARY_DAYS)).toBeUndefined()
  })
})
