// dailyPack.ts — the offline "Daily Pack".
//
// Across the western parks there is often no signal, which is exactly where the
// trip's critical facts are needed: which campground tonight, what address,
// which confirmation number, when the drive starts. Until now losing the network
// dropped Moti straight to a keyword engine with canned answers.
//
// The pack is refreshed while there is connectivity and answers from local
// storage when there is not. Cached external information (alerts, weather) is
// always presented with the time it was fetched, never as if it were live.

import type { CampsiteBooking, Document, ItineraryDay, ItineraryStop } from './types'

const PACK_KEY = 'hey-usa-daily-pack'
const PACK_VERSION = 1
const CAMPSITE_CACHE_KEY = 'hey-usa-campsite-bookings'

/** Live-sensitive information kept only with its retrieval time. */
export interface PackAlert {
  topic: string
  category: string
  summary: string
  sources: Array<{ title: string; url: string; source: string }>
  retrieved_at: string
}

export interface PackStay {
  location: string
  area?: string
  type?: string
  check_in: string
  check_out: string
  confirmation?: string
  cost?: number
  cancellation_deadline?: string
  notes?: string
}

export interface PackDay {
  date: string
  title: string
  city?: string
  notes?: string
  stops: Array<{
    title: string
    location?: string
    lat?: number
    lng?: number
    start_time?: string
    end_time?: string
    notes?: string
    booking_confirmation?: string
  }>
  stay?: PackStay
  documents: Array<{ title: string; category: string; notes?: string }>
}

export interface DailyPack {
  version: number
  built_at: string
  today?: PackDay
  tomorrow?: PackDay
  alerts: PackAlert[]
  weather_note?: string
  weather_retrieved_at?: string
  emergency: string[]
}

// Never cache anything that reads like a credential, whatever a booking note
// happens to contain. A door code is convenience; a PIN is not ours to store.
const SECRET_PATTERN = /\b(pin|password|passcode|secret|token|cvv|card\s*number)\b/i

export function stripSecrets(text?: string): string | undefined {
  if (!text) return text
  const kept = text
    .split(/\r?\n/)
    .filter((line) => !SECRET_PATTERN.test(line))
    .join('\n')
    .trim()
  return kept || undefined
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function toPackStop(stop: ItineraryStop) {
  return {
    title: stop.title,
    location: stop.location,
    lat: stop.lat,
    lng: stop.lng,
    start_time: stop.start_time,
    end_time: stop.end_time,
    notes: stripSecrets(stop.notes),
    booking_confirmation: stop.booking_confirmation,
  }
}

function stayForDate(bookings: CampsiteBooking[], date: string): PackStay | undefined {
  const match =
    bookings.find((b) => b.check_in <= date && b.check_out > date) ??
    bookings.find((b) => b.check_in === date)
  if (!match) return undefined

  return {
    location: match.location,
    area: match.area || undefined,
    type: match.type,
    check_in: match.check_in,
    check_out: match.check_out,
    confirmation: match.confirmation,
    cost: match.cost,
    cancellation_deadline: match.cancellation_deadline,
    notes: stripSecrets(match.notes),
  }
}

function documentsForDate(documents: Document[], date: string) {
  return documents
    .filter((d) => {
      const visit = (d as Document & { visit_date?: string }).visit_date
      return visit === date || d.expiry_date === date
    })
    .slice(0, 6)
    .map((d) => ({
      title: d.title,
      category: d.category,
      notes: stripSecrets(d.notes),
    }))
}

function buildDay(
  day: ItineraryDay | undefined,
  bookings: CampsiteBooking[],
  documents: Document[],
  date: string,
): PackDay | undefined {
  if (!day) return undefined
  return {
    date,
    title: day.title,
    city: day.city,
    notes: stripSecrets(day.notes),
    stops: [...day.stops].sort((a, b) => a.order - b.order).map(toPackStop),
    stay: stayForDate(bookings, date),
    documents: documentsForDate(documents, date),
  }
}

export interface BuildPackInput {
  itineraryDays: ItineraryDay[]
  bookings: CampsiteBooking[]
  documents: Document[]
  alerts?: PackAlert[]
  weatherNote?: string
  weatherRetrievedAt?: string
  emergency?: string[]
  now?: Date
}

export function buildDailyPack(input: BuildPackInput): DailyPack {
  const now = input.now ?? new Date()
  const todayStr = isoDate(now)
  const tomorrowStr = isoDate(new Date(now.getTime() + 24 * 60 * 60 * 1000))

  const byDate = new Map(input.itineraryDays.map((d) => [d.date, d]))

  return {
    version: PACK_VERSION,
    built_at: now.toISOString(),
    today: buildDay(byDate.get(todayStr), input.bookings, input.documents, todayStr),
    tomorrow: buildDay(byDate.get(tomorrowStr), input.bookings, input.documents, tomorrowStr),
    alerts: (input.alerts ?? []).slice(0, 8),
    weather_note: input.weatherNote,
    weather_retrieved_at: input.weatherRetrievedAt,
    emergency: input.emergency ?? ['חירום בארה"ב: 911'],
  }
}

// ─── Persistence ─────────────────────────────────────────────────────────────

export function saveDailyPack(pack: DailyPack): void {
  try {
    localStorage.setItem(PACK_KEY, JSON.stringify(pack))
  } catch {
    // Storage full or blocked — the pack is a convenience, never a hard failure.
  }
}

export function loadDailyPack(): DailyPack | null {
  try {
    const raw = localStorage.getItem(PACK_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DailyPack
    if (parsed?.version !== PACK_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

export function loadCachedBookings(): CampsiteBooking[] {
  try {
    const raw = localStorage.getItem(CAMPSITE_CACHE_KEY)
    return raw ? (JSON.parse(raw) as CampsiteBooking[]) : []
  } catch {
    return []
  }
}

/** Adds an alert to the stored pack, keeping the newest per topic. */
export function recordPackAlert(alert: PackAlert): void {
  const pack = loadDailyPack()
  if (!pack) return
  const others = pack.alerts.filter((a) => a.topic !== alert.topic)
  saveDailyPack({ ...pack, alerts: [alert, ...others].slice(0, 8) })
}

// ─── Offline answering ───────────────────────────────────────────────────────

function hebrewDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return y && m && d ? `${d}/${m}` : iso
}

function timeAgo(iso: string, now: Date): string {
  const ms = now.getTime() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return iso
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `לפני ${minutes} דקות`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `לפני ${hours} שעות`
  return `לפני ${Math.round(hours / 24)} ימים`
}

function describeStay(stay: PackStay | undefined, label: string): string {
  if (!stay) return `אין לי לינה שמורה ל${label} בחבילת המידע המקומית.`
  const lines = [`🏨 ${label}: ${stay.location}`]
  if (stay.area) lines.push(`📍 ${stay.area}`)
  if (stay.confirmation) lines.push(`🔖 אישור: ${stay.confirmation}`)
  if (stay.check_in)
    lines.push(`צ'ק-אין ${hebrewDate(stay.check_in)}, צ'ק-אאוט ${hebrewDate(stay.check_out)}`)
  if (stay.notes) lines.push(stay.notes)
  return lines.join('\n')
}

function describeDay(day: PackDay | undefined, label: string): string {
  if (!day) return `אין לי תכנית שמורה ל${label} בחבילת המידע המקומית.`
  const lines = [`📅 ${label} (${hebrewDate(day.date)}) — ${day.title}`]
  if (day.city) lines.push(`עיר: ${day.city}`)
  for (const stop of day.stops.slice(0, 8)) {
    const time = stop.start_time ? `${stop.start_time} ` : ''
    lines.push(`• ${time}${stop.title}${stop.location ? ` — ${stop.location}` : ''}`)
  }
  if (day.stay) lines.push(`🏨 לינה: ${day.stay.location}`)
  if (day.notes) lines.push(day.notes)
  return lines.join('\n')
}

const OFFLINE_PREFIX = '📴 אין חיבור כרגע, אז אני עונה מחבילת המידע המקומית.'

/**
 * Answers from the pack, or returns null so the caller can fall through to the
 * keyword engine. Anything live-sensitive is stamped with when it was fetched.
 */
export function answerFromDailyPack(
  question: string,
  pack: DailyPack | null,
  now: Date = new Date(),
): string | null {
  if (!pack) return null
  const q = (question || '').toLowerCase()
  const wantsTomorrow = /מחר|tomorrow/.test(q)
  const day = wantsTomorrow ? pack.tomorrow : pack.today
  const label = wantsTomorrow ? 'מחר' : 'היום'

  // Live-sensitive first: these must never be answered as if freshly checked.
  if (
    /התרא|alert|סגור|סגיר|חסימ|כביש|road|closure|closed|שריפ|fire|מזג|weather|תחזית|forecast/.test(
      q,
    )
  ) {
    const lines = [OFFLINE_PREFIX]
    if (pack.alerts.length === 0 && !pack.weather_note) {
      lines.push(
        'אין לי התראות שמורות, ואני לא יכול לאמת מצב עכשווי בלי רשת. בדקו בשילוט בכניסה לפארק או ברדיו המקומי.',
      )
      return lines.join('\n\n')
    }
    for (const alert of pack.alerts.slice(0, 4)) {
      lines.push(
        `⚠️ ${alert.topic}: ${alert.summary}\n🕒 נבדק לאחרונה ${timeAgo(alert.retrieved_at, now)}${
          alert.sources[0] ? ` (${alert.sources[0].source})` : ''
        }`,
      )
    }
    if (pack.weather_note) {
      lines.push(
        `🌤️ ${pack.weather_note}${
          pack.weather_retrieved_at
            ? `\n🕒 נבדק לאחרונה ${timeAgo(pack.weather_retrieved_at, now)}`
            : ''
        }`,
      )
    }
    lines.push('לא הצלחתי לאמת את זה עכשיו מול המקור הרשמי; המידע הוא מהפעם האחרונה שהייתה רשת.')
    return lines.join('\n\n')
  }

  if (/כתובת|address|איפה זה|נווט|navigate/.test(q)) {
    const stay = day?.stay
    if (stay) {
      const coords = day?.stops.find((s) => s.lat && s.lng)
      const parts = [`📍 ${stay.location}`]
      if (stay.area) parts.push(stay.area)
      if (coords?.lat && coords?.lng) parts.push(`קואורדינטות קרובות: ${coords.lat}, ${coords.lng}`)
      return `${OFFLINE_PREFIX}\n\n${parts.join('\n')}`
    }
    return `${OFFLINE_PREFIX}\n\nאין לי כתובת שמורה ל${label}.`
  }

  if (/ישנים|לנים|מתאכסנים|לינה|מלון|קמפינג|sleep|stay|hotel|campground/.test(q)) {
    return `${OFFLINE_PREFIX}\n\n${describeStay(day?.stay, wantsTomorrow ? 'מחר' : 'הלילה')}`
  }

  if (/אישור|הזמנה|confirmation|booking/.test(q)) {
    const stay = day?.stay
    const stopWithConf = day?.stops.find((s) => s.booking_confirmation)
    if (stay?.confirmation || stopWithConf) {
      const lines = [OFFLINE_PREFIX]
      if (stay?.confirmation) lines.push(`🏨 ${stay.location} — אישור ${stay.confirmation}`)
      if (stopWithConf) {
        lines.push(`🎟️ ${stopWithConf.title} — אישור ${stopWithConf.booking_confirmation}`)
      }
      return lines.join('\n\n')
    }
    return `${OFFLINE_PREFIX}\n\nאין לי מספר אישור שמור ל${label}.`
  }

  if (/חירום|emergency|משטרה|אמבולנס|911/.test(q)) {
    return `${OFFLINE_PREFIX}\n\n${pack.emergency.join('\n')}`
  }

  if (/תכנית|תוכנית|מה עושים|לוז|מסלול|plan|schedule|itinerary|מה יש/.test(q)) {
    return `${OFFLINE_PREFIX}\n\n${describeDay(day, label)}`
  }

  return null
}
