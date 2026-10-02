import exifr from 'exifr/dist/lite.esm.mjs'
import type { ItineraryDay } from '@/lib/types'

/** What a photo file can tell us about when and where it was taken. */
export interface PhotoMetadata {
  /** Wall-clock date at the place the photo was taken, YYYY-MM-DD */
  localDate?: string
  /** Absolute capture time, ISO 8601 with an explicit offset */
  takenAt?: string
  lat?: number
  lng?: number
}

/**
 * UTC offsets for the trip's own days, used only when a camera records the
 * wall-clock time without its offset (older phones). Modern iPhones and
 * Androids write OffsetTimeOriginal, which always wins.
 * Newark is Eastern; Montana, Wyoming and Utah are Mountain; Las Vegas and
 * California are Pacific. All daylight time in September.
 */
const TRIP_UTC_OFFSETS: { from: string; to: string; offset: string }[] = [
  { from: '2026-09-10', to: '2026-09-10', offset: '-04:00' },
  { from: '2026-09-11', to: '2026-09-21', offset: '-06:00' },
  { from: '2026-09-22', to: '2026-09-30', offset: '-07:00' },
]

export function tripUtcOffset(localDate: string): string | undefined {
  return TRIP_UTC_OFFSETS.find((r) => localDate >= r.from && localDate <= r.to)?.offset
}

const EXIF_DATE_RE = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/
const OFFSET_RE = /^[+-]\d{2}:\d{2}$/

/**
 * Turn EXIF "2026:09:25 18:42:10" (+ optional "-07:00") into the local date
 * and an ISO timestamp. Without an offset, the trip's timezone for that date
 * is used; outside the trip there is no honest way to place it, so takenAt
 * stays empty and only the date is kept.
 */
export function parseExifDateTime(
  raw: unknown,
  offset?: unknown,
): { localDate: string; takenAt?: string } | null {
  if (typeof raw !== 'string') return null
  const m = EXIF_DATE_RE.exec(raw.trim())
  if (!m) return null
  const [, y, mo, d, h, mi, s] = m
  // Cameras with no clock set write 0000:00:00
  if (y === '0000' || mo === '00' || d === '00') return null
  const localDate = `${y}-${mo}-${d}`
  const tz =
    typeof offset === 'string' && OFFSET_RE.test(offset.trim())
      ? offset.trim()
      : tripUtcOffset(localDate)
  if (!tz) return { localDate }
  const takenAt = `${localDate}T${h}:${mi}:${s}${tz}`
  return Number.isNaN(Date.parse(takenAt)) ? { localDate } : { localDate, takenAt }
}

function validCoord(v: unknown, limit: number): v is number {
  return typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= limit && v !== 0
}

/** Read capture date and GPS from a JPEG/HEIC file. Never throws. */
export async function readPhotoMetadata(file: Blob): Promise<PhotoMetadata> {
  try {
    const tags = await exifr.parse(file, {
      exif: true,
      gps: true,
      reviveValues: false,
    })
    if (!tags) return {}
    const when =
      parseExifDateTime(tags.DateTimeOriginal, tags.OffsetTimeOriginal) ??
      parseExifDateTime(tags.CreateDate, tags.OffsetTime)
    const result: PhotoMetadata = { ...when }
    if (validCoord(tags.latitude, 90) && validCoord(tags.longitude, 180)) {
      result.lat = tags.latitude
      result.lng = tags.longitude
    }
    return result
  } catch (err) {
    console.warn('[photos] Could not read photo metadata:', err)
    return {}
  }
}

/** The trip day whose date matches the photo's local date, if any. */
export function findTripDay(
  localDate: string | undefined,
  days: Pick<ItineraryDay, 'id' | 'date' | 'city'>[],
): Pick<ItineraryDay, 'id' | 'date' | 'city'> | undefined {
  if (!localDate) return undefined
  return days.find((d) => d.date === localDate)
}
