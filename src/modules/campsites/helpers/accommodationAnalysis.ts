// src/modules/campsites/helpers/accommodationAnalysis.ts

interface Booking {
  id: string
  check_in: string // YYYY-MM-DD
  check_out: string // YYYY-MM-DD
  location: string
  status?: string
}

interface NightGap {
  date: string
  dayLabel: string
}

interface DoubleBooking {
  date: string
  bookings: string[] // location names
}

// Trip dates
const TRIP_START = '2026-09-10'
const TRIP_END = '2026-09-30'

/**
 * Find nights during the trip with no accommodation booked.
 * Cancelled bookings are excluded from coverage.
 */
export function findMissingNights(bookings: Booking[]): NightGap[] {
  const activeBookings = bookings.filter((b) => b.status !== 'cancelled')
  const start = new Date(TRIP_START)
  const end = new Date(TRIP_END)
  const gaps: NightGap[] = []

  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const hasCoverage = activeBookings.some((b) => {
      const checkIn = new Date(b.check_in)
      const checkOut = new Date(b.check_out)
      return d >= checkIn && d < checkOut
    })

    if (!hasCoverage) {
      const dayNum = Math.floor((d.getTime() - start.getTime()) / 86400000) + 1
      const weekday = d.toLocaleDateString('he-IL', { weekday: 'short' })
      gaps.push({ date: dateStr, dayLabel: `${weekday} יום ${dayNum}` })
    }
  }

  return gaps
}

/**
 * Find dates with overlapping bookings (double-bookings).
 * Cancelled and backup bookings are excluded.
 */
export function findDoubleBookings(bookings: Booking[]): DoubleBooking[] {
  // Only consider active primary bookings for double-booking detection
  const activeBookings = bookings.filter(
    (b) => b.status !== 'cancelled' && (b as { priority?: string }).priority !== 'backup',
  )
  const start = new Date(TRIP_START)
  const end = new Date(TRIP_END)
  const doubles: DoubleBooking[] = []

  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const covering = activeBookings.filter((b) => {
      const checkIn = new Date(b.check_in)
      const checkOut = new Date(b.check_out)
      return d >= checkIn && d < checkOut
    })

    if (covering.length > 1) {
      doubles.push({
        date: dateStr,
        bookings: covering.map((b) => b.location),
      })
    }
  }

  return doubles
}
