import { ITINERARY_DAYS } from '@/data/itinerary'

describe('ITINERARY_DAYS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(ITINERARY_DAYS)).toBe(true)
    expect(ITINERARY_DAYS.length).toBeGreaterThan(0)
  })

  it.each(ITINERARY_DAYS.map((d) => [d.id, d]))('day %s has required fields', (_id, day) => {
    expect(typeof day.id).toBe('string')
    expect(day.id.length).toBeGreaterThan(0)
    expect(typeof day.date).toBe('string')
    expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(typeof day.title).toBe('string')
    expect(day.title.length).toBeGreaterThan(0)
    expect(Array.isArray(day.stops)).toBe(true)
  })

  it('day IDs follow the "day-N" pattern', () => {
    for (const day of ITINERARY_DAYS) {
      expect(day.id).toMatch(/^day-\d+$/)
    }
  })

  it('day IDs are sequential starting from 1', () => {
    for (let i = 0; i < ITINERARY_DAYS.length; i++) {
      expect(ITINERARY_DAYS[i].id).toBe(`day-${i + 1}`)
    }
  })

  it('all days have unique ids', () => {
    const ids = ITINERARY_DAYS.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each stop has required fields', () => {
    for (const day of ITINERARY_DAYS) {
      for (const stop of day.stops) {
        expect(typeof stop.id).toBe('string')
        expect(stop.id.length).toBeGreaterThan(0)
        expect(typeof stop.title).toBe('string')
        expect(stop.title.length).toBeGreaterThan(0)
        expect(typeof stop.order).toBe('number')
      }
    }
  })

  it('stop IDs are unique across the entire itinerary', () => {
    const allStopIds = ITINERARY_DAYS.flatMap((d) => d.stops.map((s) => s.id))
    expect(new Set(allStopIds).size).toBe(allStopIds.length)
  })

  it('every day has at least one stop', () => {
    for (const day of ITINERARY_DAYS) {
      expect(day.stops.length).toBeGreaterThan(0)
    }
  })
})
