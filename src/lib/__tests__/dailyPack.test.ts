import { describe, it, expect, beforeEach } from 'vitest'
import {
  answerFromDailyPack,
  buildDailyPack,
  loadDailyPack,
  recordPackAlert,
  saveDailyPack,
  stripSecrets,
  type DailyPack,
} from '../dailyPack'
import type { CampsiteBooking, Document, ItineraryDay } from '../types'

// Inside the parks there is often no signal. Before the Daily Pack, losing the
// network dropped Moti to canned keyword answers, so "what is our confirmation
// number" at a campground gate got a joke instead of a number. These tests pin
// what must survive offline, and that cached external information is never
// presented as if it had just been checked.

const NOW = new Date('2026-09-12T08:00:00.000Z')

const itineraryDays: ItineraryDay[] = [
  {
    id: 'day-3',
    date: '2026-09-12',
    title: 'ילוסטון — Mammoth Hot Springs',
    city: 'Gardiner, MT',
    notes: 'להתחיל מוקדם',
    stops: [
      {
        id: 's1',
        title: 'Mammoth Hot Springs',
        location: 'Yellowstone NP',
        lat: 44.976,
        lng: -110.703,
        start_time: '08:30',
        order: 1,
      },
      {
        id: 's2',
        title: 'Lamar Valley',
        location: 'Yellowstone NP',
        start_time: '14:00',
        order: 2,
        booking_confirmation: 'TOUR-77',
      },
    ],
  },
  {
    id: 'day-4',
    date: '2026-09-13',
    title: 'Old Faithful',
    city: 'Yellowstone',
    stops: [{ id: 's3', title: 'Old Faithful', order: 1 }],
  },
]

const bookings: CampsiteBooking[] = [
  {
    id: 'camp-03',
    check_in: '2026-09-11',
    check_out: '2026-09-14',
    location: 'Yellowstone RV Park',
    area: '121 US-89, Gardiner, MT 59030',
    type: 'rv_park',
    priority: 'primary',
    status: 'confirmed',
    confirmation: 'YRV-556677',
    cost: 312,
    notes: "צ'ק-אין עד 20:00\nPIN לשער: 4417",
    changelog: [],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
]

const documents: Document[] = [
  {
    id: 'doc-1',
    title: 'אישור הזמנה — Yellowstone RV Park',
    category: 'campsite_reservation',
    notes: 'confirmation YRV-556677',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  } as Document,
]

function pack(): DailyPack {
  return buildDailyPack({ itineraryDays, bookings, documents, now: NOW })
}

beforeEach(() => {
  localStorage.clear()
})

describe('stripSecrets', () => {
  it('drops a line carrying a gate PIN but keeps the rest', () => {
    const kept = stripSecrets("צ'ק-אין עד 20:00\nPIN לשער: 4417")
    expect(kept).toBe("צ'ק-אין עד 20:00")
  })

  it('leaves ordinary notes alone', () => {
    expect(stripSecrets('חניה מול הקבלה')).toBe('חניה מול הקבלה')
  })
})

describe('buildDailyPack', () => {
  it('covers today and tomorrow only', () => {
    const p = pack()
    expect(p.today?.date).toBe('2026-09-12')
    expect(p.tomorrow?.date).toBe('2026-09-13')
  })

  it('attaches the stay that spans the night, with its confirmation', () => {
    const p = pack()
    expect(p.today?.stay?.location).toBe('Yellowstone RV Park')
    expect(p.today?.stay?.confirmation).toBe('YRV-556677')
    expect(p.today?.stay?.area).toContain('Gardiner')
  })

  it('never caches a PIN from booking notes', () => {
    expect(JSON.stringify(pack())).not.toContain('4417')
  })

  it('keeps stops in order with times and coordinates', () => {
    const stops = pack().today?.stops ?? []
    expect(stops.map((s) => s.title)).toEqual(['Mammoth Hot Springs', 'Lamar Valley'])
    expect(stops[0].lat).toBe(44.976)
    expect(stops[0].start_time).toBe('08:30')
  })
})

describe('persistence', () => {
  it('round-trips through localStorage', () => {
    saveDailyPack(pack())
    expect(loadDailyPack()?.today?.title).toContain('ילוסטון')
  })

  it('returns null when nothing is stored', () => {
    expect(loadDailyPack()).toBeNull()
  })

  it('rejects a pack written by an older version', () => {
    localStorage.setItem('hey-usa-daily-pack', JSON.stringify({ version: 0, alerts: [] }))
    expect(loadDailyPack()).toBeNull()
  })

  it('keeps the newest alert per topic', () => {
    saveDailyPack(pack())
    recordPackAlert({
      topic: 'Yellowstone alerts',
      category: 'parks',
      summary: 'Old',
      sources: [],
      retrieved_at: '2026-09-12T05:00:00.000Z',
    })
    recordPackAlert({
      topic: 'Yellowstone alerts',
      category: 'parks',
      summary: 'New',
      sources: [],
      retrieved_at: '2026-09-12T07:00:00.000Z',
    })
    const alerts = loadDailyPack()?.alerts ?? []
    expect(alerts).toHaveLength(1)
    expect(alerts[0].summary).toBe('New')
  })
})

describe('answerFromDailyPack — offline acceptance cases', () => {
  it('1. answers "what is the plan today"', () => {
    const answer = answerFromDailyPack('מה התכנית להיום?', pack(), NOW)
    expect(answer).toContain('Mammoth Hot Springs')
    expect(answer).toContain('אין חיבור')
  })

  it('1b. answers the same question for tomorrow', () => {
    const answer = answerFromDailyPack('מה התכנית מחר?', pack(), NOW)
    expect(answer).toContain('Old Faithful')
  })

  it('2. answers "where are we sleeping tonight"', () => {
    const answer = answerFromDailyPack('איפה אנחנו ישנים הלילה?', pack(), NOW)
    expect(answer).toContain('Yellowstone RV Park')
  })

  it('3. answers "what is the campground address"', () => {
    const answer = answerFromDailyPack('מה הכתובת של הקמפינג?', pack(), NOW)
    expect(answer).toContain('Gardiner')
    expect(answer).toContain('44.976')
  })

  it('4. answers "what is our booking confirmation"', () => {
    const answer = answerFromDailyPack('מה מספר האישור שלנו?', pack(), NOW)
    expect(answer).toContain('YRV-556677')
  })

  it('5. gives a cached alert with its age and says it is unverified', () => {
    const withAlert: DailyPack = {
      ...pack(),
      alerts: [
        {
          topic: 'Yellowstone',
          category: 'parks',
          summary: 'North Entrance closed to RVs',
          sources: [{ title: 'NPS', url: 'https://nps.gov/yell', source: 'nps.gov' }],
          retrieved_at: '2026-09-12T06:12:00.000Z',
        },
      ],
    }
    const answer = answerFromDailyPack('יש התראות בפארק?', withAlert, NOW)
    expect(answer).toContain('North Entrance closed to RVs')
    expect(answer).toContain('לפני 2 שעות')
    expect(answer).toContain('nps.gov')
    expect(answer).toContain('לא הצלחתי לאמת')
  })

  it('5b. says plainly that nothing is cached when there are no alerts', () => {
    const answer = answerFromDailyPack('יש סגירות כבישים?', pack(), NOW)
    expect(answer).toContain('אין לי התראות שמורות')
    expect(answer).toContain('בלי רשת')
  })

  it('answers the emergency question', () => {
    expect(answerFromDailyPack('מה מספר חירום?', pack(), NOW)).toContain('911')
  })

  it('returns null for anything it cannot answer, so the keyword engine runs', () => {
    expect(answerFromDailyPack('ספר לי בדיחה', pack(), NOW)).toBeNull()
  })

  it('returns null when there is no pack at all', () => {
    expect(answerFromDailyPack('מה התכנית להיום?', null, NOW)).toBeNull()
  })

  it('survives an app restart: a stored pack still answers', () => {
    saveDailyPack(pack())
    // Simulates a fresh page load — nothing in memory, only localStorage.
    const answer = answerFromDailyPack('איפה ישנים הלילה?', loadDailyPack(), NOW)
    expect(answer).toContain('Yellowstone RV Park')
  })

  it('answers the same regardless of which family member asks', () => {
    const a = answerFromDailyPack('איפה אנחנו ישנים הלילה?', pack(), NOW)
    const b = answerFromDailyPack('איפה אנחנו ישנים הלילה?', pack(), NOW)
    expect(a).toBe(b)
  })

  it('says so plainly when the day has no stored stay', () => {
    const empty = buildDailyPack({
      itineraryDays,
      bookings: [],
      documents: [],
      now: NOW,
    })
    expect(answerFromDailyPack('איפה ישנים הלילה?', empty, NOW)).toContain('אין לי לינה שמורה')
  })
})
