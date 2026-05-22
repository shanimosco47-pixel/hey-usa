import type { CampsiteBooking } from '@/types'

export interface ParsedBooking {
  confirmationNum?: string
  checkIn?: string
  checkOut?: string
  cost?: number
  cancellationDeadline?: string
  refundAmount?: number
  locationName?: string
  area?: string
  locationId?: string
  type: 'rv_park' | 'campground' | 'hotel'
  matchingBooking?: CampsiteBooking
}

const MONTH_NAMES: Record<string, string> = {
  jan: '01',
  january: '01',
  feb: '02',
  february: '02',
  mar: '03',
  march: '03',
  apr: '04',
  april: '04',
  may: '05',
  jun: '06',
  june: '06',
  jul: '07',
  july: '07',
  aug: '08',
  august: '08',
  sep: '09',
  sept: '09',
  september: '09',
  oct: '10',
  october: '10',
  nov: '11',
  november: '11',
  dec: '12',
  december: '12',
}

const AREA_TO_LOCATION_ID: Record<string, string> = {
  'Yellowstone NP': 'yellowstone',
  'Yosemite NP': 'yosemite',
  'Zion NP': 'zion',
  'Bryce Canyon': 'bryce-canyon',
  'Grand Teton': 'grand-teton',
  'Mammoth Lakes': 'mammoth-lakes',
  'Las Vegas': 'las-vegas',
  Denver: 'denver',
  'San Francisco': 'san-francisco',
}

function parseMonthDate(str: string): string | undefined {
  const m = str.match(/(\w+)\s+(\d{1,2}),?\s*(\d{4})/)
  if (!m) return undefined
  const monthNum = MONTH_NAMES[m[1].toLowerCase()]
  if (!monthNum) return undefined
  return `${m[3]}-${monthNum}-${m[2].padStart(2, '0')}`
}

function parseSlashDate(str: string): string | undefined {
  const m = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!m) return undefined
  return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
}

export function parseBookingConfirmation(
  text: string,
  bookings: CampsiteBooking[],
): ParsedBooking | null {
  const hasConfirmationKeywords =
    /(?:confirmation|itinerary\s*#|reservation\s*(?:status|total|details|confirmation)|check.?in|check.?out|your\s+reservation)/i.test(
      text,
    )
  const hasDatePattern =
    /\d{1,2}\/\d{1,2}\/\d{4}|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2},?\s*\d{4}/i.test(
      text,
    )
  if (!hasConfirmationKeywords || !hasDatePattern) return null

  // Allow alphanumeric prefix (e.g. "R00000020957", "20452131")
  const confMatch = text.match(
    /(?:itinerary|confirmation|reservation)\s*#?\s*([A-Za-z0-9][A-Za-z0-9-]{4,})/i,
  )
  const confirmationNum = confMatch ? confMatch[1] : undefined

  const allDates: { date: string; index: number }[] = []
  for (const m of text.matchAll(/(\d{1,2}\/\d{1,2}\/\d{4})/gi)) {
    const d = parseSlashDate(m[1])
    if (d) allDates.push({ date: d, index: m.index! })
  }
  for (const m of text.matchAll(
    /(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2},?\s*\d{4})/gi,
  )) {
    const d = parseMonthDate(m[1])
    if (d) allDates.push({ date: d, index: m.index! })
  }
  allDates.sort((a, b) => a.index - b.index)

  let checkIn: string | undefined
  let checkOut: string | undefined
  const tripDates = allDates.filter((d) => d.date.startsWith('2026-09'))
  if (tripDates.length >= 2) {
    checkIn = tripDates[0].date
    checkOut = tripDates[1].date
  } else if (tripDates.length === 1) {
    checkIn = tripDates[0].date
  }

  // Cost — includes subtotal variants used by Campspot
  const costMatch = text.match(
    /(?:reservation\s+total|lodging\s+total|order\s+total|total\s+cost|subtotal|order\s+subtotal)[^$]*\$(\d+(?:\.\d{2})?)/i,
  )
  const cost = costMatch ? parseFloat(costMatch[1]) : undefined

  let cancellationDeadline: string | undefined
  const cancelAfter = text.match(
    /cancell?(?:ed|ation)\s+(?:after|on\s+or\s+after)\s+\w+,?\s+(\w+\s+\d{1,2},?\s*\d{4})/i,
  )
  if (cancelAfter) cancellationDeadline = parseMonthDate(cancelAfter[1])
  if (!cancellationDeadline) {
    const cancelBefore = text.match(
      /cancel[^]*?on\s+or\s+before\s+\w+,?\s+(\w+\s+\d{1,2},?\s*\d{4})/i,
    )
    if (cancelBefore) cancellationDeadline = parseMonthDate(cancelBefore[1])
  }

  const refundMatch = text.match(/(?:refund|penalty)[^$]*\$(\d+(?:\.\d{2})?)/i)
  const refundAmount = refundMatch ? parseFloat(refundMatch[1]) : undefined

  // Location name — NPS campground names first, then generic RV park / campground names
  const campgroundPatterns = [
    /(?:north|south|canyon|madison|grant|bridge bay|mammoth|tower|indian creek|pebble creek|slough creek|norris|lewis lake|watchman|lava point|upper pines|lower pines|north pines|crane flat|hodgdon meadow|wawona|bridalveil creek)\s*(?:campground|camp)?/i,
  ]
  let locationName: string | undefined
  for (const pat of campgroundPatterns) {
    const m = text.match(pat)
    if (m) {
      locationName = m[0].trim()
      break
    }
  }
  if (!locationName) {
    const m = text.match(/([A-Za-z][A-Za-z\s]+(?:RV\s+Park|RV\s+Resort|Campground|Campsite))/i)
    if (m) locationName = m[0].trim()
  }
  if (!locationName) {
    const m = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:campground|camp|lodge)/i)
    if (m) locationName = m[0].trim()
  }

  const isYellowstone = /yellowstone/i.test(text)
  const isYosemite = /yosemite/i.test(text)
  const isZion = /zion/i.test(text)
  const isBryce = /bryce/i.test(text)
  const isGrandTeton = /grand\s*teton|jenny\s*lake|colter\s*bay|gros\s*ventre/i.test(text)
  const isLasVegas = /las\s*vegas/i.test(text)
  const isMammoth = /mammoth\s*lakes/i.test(text)
  const isDenver = /denver/i.test(text)
  const isSF = /san\s*francisco|oakland|marin/i.test(text)
  const area = isYellowstone
    ? 'Yellowstone NP'
    : isYosemite
      ? 'Yosemite NP'
      : isZion
        ? 'Zion NP'
        : isBryce
          ? 'Bryce Canyon'
          : isGrandTeton
            ? 'Grand Teton'
            : isLasVegas
              ? 'Las Vegas'
              : isMammoth
                ? 'Mammoth Lakes'
                : isDenver
                  ? 'Denver'
                  : isSF
                    ? 'San Francisco'
                    : undefined

  const locationId = area ? AREA_TO_LOCATION_ID[area] : undefined

  const isRV = /\brv\b|camper|motorhome|recreational\s+vehicle/i.test(text)
  const isCamp = /campground|camping|campsite/i.test(text)
  const type = isRV || isCamp ? 'campground' : 'hotel'

  if (!checkIn) return null

  const matchingBooking = bookings.find(
    (b) =>
      b.check_in === checkIn &&
      b.priority === 'primary' &&
      (b.status === 'not_open' || b.status === 'pending' || b.status === 'waitlist'),
  )

  return {
    confirmationNum,
    checkIn,
    checkOut,
    cost,
    cancellationDeadline,
    refundAmount,
    locationName,
    area,
    locationId,
    type: type as 'rv_park' | 'campground' | 'hotel',
    matchingBooking,
  }
}
