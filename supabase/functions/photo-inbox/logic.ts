// Pure logic for the photo-inbox edge function (no Deno APIs, so vitest covers it).
// Mirrors src/modules/photos/lib/photoMetadata.ts: the edge function cannot import
// from src/, and a test asserts both agree with the app's itinerary.

export const FAMILY_MEMBERS = ['aba', 'ima', 'kid1', 'kid2', 'kid3'] as const
export type Member = (typeof FAMILY_MEMBERS)[number]

export const MAX_PHOTO_BYTES = 20 * 1024 * 1024

/** The app's itinerary days (src/data/itinerary.ts). A test keeps them in sync. */
export const TRIP_DAYS: { id: string; date: string; city: string }[] = [
  { id: 'day-1', date: '2026-09-10', city: 'Newark' },
  { id: 'day-2', date: '2026-09-11', city: 'Newark → Bozeman → Gardiner' },
  { id: 'day-3', date: '2026-09-12', city: 'Gardiner → Canyon Village' },
  { id: 'day-4', date: '2026-09-13', city: 'Canyon Village → Madison' },
  { id: 'day-5', date: '2026-09-14', city: 'Madison → Grant Village' },
  { id: 'day-6', date: '2026-09-15', city: 'Grant Village → Jackson, WY' },
  { id: 'day-7', date: '2026-09-16', city: 'Jackson, WY' },
  { id: 'day-8', date: '2026-09-17', city: 'Jackson, WY → Provo / Nephi' },
  { id: 'day-9', date: '2026-09-18', city: 'Provo / Nephi → Bryce Canyon' },
  { id: 'day-10', date: '2026-09-19', city: 'Bryce Canyon → Zion (Springdale)' },
  { id: 'day-11', date: '2026-09-20', city: 'Zion National Park' },
  { id: 'day-12', date: '2026-09-21', city: 'Zion → Las Vegas' },
  { id: 'day-13', date: '2026-09-22', city: 'Las Vegas' },
  { id: 'day-14', date: '2026-09-23', city: 'Las Vegas → Mammoth Lakes' },
  { id: 'day-15', date: '2026-09-24', city: 'Mammoth Lakes → Yosemite Valley' },
  { id: 'day-16', date: '2026-09-25', city: 'Yosemite Valley' },
  { id: 'day-17', date: '2026-09-26', city: 'Yosemite Valley → Wawona' },
  { id: 'day-18', date: '2026-09-27', city: 'Wawona → Anthony Chabot' },
  { id: 'day-19', date: '2026-09-28', city: 'Anthony Chabot → Marin RV Park' },
  { id: 'day-20', date: '2026-09-29', city: 'Marin → San Francisco' },
  { id: 'day-21', date: '2026-09-30', city: 'San Francisco → Home' },
]

const TRIP_UTC_OFFSETS = [
  { from: '2026-09-10', to: '2026-09-10', offset: '-04:00' },
  { from: '2026-09-11', to: '2026-09-21', offset: '-06:00' },
  { from: '2026-09-22', to: '2026-09-30', offset: '-07:00' },
]

const EXIF_DATE_RE = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/
const OFFSET_RE = /^[+-]\d{2}:\d{2}$/

export function parseExifDateTime(
  raw: unknown,
  offset?: unknown,
): { localDate: string; takenAt?: string } | null {
  if (typeof raw !== 'string') return null
  const m = EXIF_DATE_RE.exec(raw.trim())
  if (!m) return null
  const [, y, mo, d, h, mi, s] = m
  if (y === '0000' || mo === '00' || d === '00') return null
  const localDate = `${y}-${mo}-${d}`
  const tz =
    typeof offset === 'string' && OFFSET_RE.test(offset.trim())
      ? offset.trim()
      : TRIP_UTC_OFFSETS.find((r) => localDate >= r.from && localDate <= r.to)?.offset
  if (!tz) return { localDate }
  const takenAt = `${localDate}T${h}:${mi}:${s}${tz}`
  return Number.isNaN(Date.parse(takenAt)) ? { localDate } : { localDate, takenAt }
}

export function isMember(v: unknown): v is Member {
  return typeof v === 'string' && (FAMILY_MEMBERS as readonly string[]).includes(v)
}

/** Identify the image by its first bytes; the Content-Type a Shortcut sends is not trusted. */
export function sniffImage(bytes: Uint8Array): 'jpeg' | 'png' | 'heic' | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg'
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png'
  const brand = String.fromCharCode(...bytes.slice(4, 12))
  if (/^ftyp(heic|heix|hevc|mif1|msf1|heim|heis)/.test(brand)) return 'heic'
  return null
}

export interface ExifTags {
  DateTimeOriginal?: unknown
  OffsetTimeOriginal?: unknown
  CreateDate?: unknown
  OffsetTime?: unknown
  latitude?: unknown
  longitude?: unknown
}

function coord(v: unknown, limit: number): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v !== 0 && Math.abs(v) <= limit ? v : null
}

/** Build the photos row the app expects (same columns as src/lib/database.ts upsertPhoto). */
export function buildPhotoRow(input: {
  id: string
  url: string
  member: Member
  tags: ExifTags | null | undefined
  now: string
}) {
  const t = input.tags ?? {}
  const when =
    parseExifDateTime(t.DateTimeOriginal, t.OffsetTimeOriginal) ??
    parseExifDateTime(t.CreateDate, t.OffsetTime)
  const day = when ? TRIP_DAYS.find((d) => d.date === when.localDate) : undefined
  const lat = coord(t.latitude, 90)
  const lng = coord(t.longitude, 180)
  return {
    id: input.id,
    url: input.url,
    thumbnail_url: null,
    caption: null,
    taken_at: when?.takenAt ?? input.now,
    taken_by: input.member,
    location: day?.city ?? null,
    lat: lat !== null && lng !== null ? lat : null,
    lng: lat !== null && lng !== null ? lng : null,
    day_id: day?.id ?? null,
    tags: [] as string[],
    is_favorite: false,
    created_at: input.now,
  }
}
