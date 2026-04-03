// patterns.ts — Pattern matching and classification for email scan pipeline

// ---------------------------------------------------------------------------
// Known sender domains
// ---------------------------------------------------------------------------

const KNOWN_SENDER_DOMAINS = [
  'united.com',
  'aircanada.com',
  'delta.com',
  'aa.com',
  'elal.com',
  'recreation.gov',
  'xanterra.com',
  'booking.com',
  'airbnb.com',
  'hotels.com',
  'expedia.com',
  'cruiseamerica.com',
  'rvshare.com',
  'bandana.co.il',
  'rentalcover.com',
  'passportcard.co.il',
  'harel-group.co.il',
  'tripit.com',
]

// ---------------------------------------------------------------------------
// Subject keywords
// ---------------------------------------------------------------------------

const SUBJECT_KEYWORDS_EN = [
  'confirmation',
  'itinerary',
  'reservation',
  'booking',
  'receipt',
  'e-ticket',
  'eticket',
  'rental agreement',
  'your trip',
  'your order',
]

const SUBJECT_KEYWORDS_HE = ['אישור', 'הזמנה', 'קבלה', 'כרטיס', 'הזמנת']

const EXCLUDE_KEYWORDS = [
  'newsletter',
  'unsubscribe',
  'marketing',
  'promo',
  'sale',
  'survey',
  'feedback',
  'rate your',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractDomain(email: string): string {
  const match = email.match(/@([\w.-]+)/)
  return match ? match[1].toLowerCase() : ''
}

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some((kw) => lower.includes(kw.toLowerCase()))
}

function isKnownSender(fromEmail: string): boolean {
  const domain = extractDomain(fromEmail)
  return KNOWN_SENDER_DOMAINS.some((known) => domain === known || domain.endsWith('.' + known))
}

function hasSubjectKeyword(subject: string): boolean {
  // Check English keywords (case-insensitive)
  if (containsAny(subject, SUBJECT_KEYWORDS_EN)) return true
  // Check Hebrew keywords (direct substring, already Unicode)
  return SUBJECT_KEYWORDS_HE.some((kw) => subject.includes(kw))
}

// ---------------------------------------------------------------------------
// Forwarded email original sender extraction
// ---------------------------------------------------------------------------

/**
 * Extracts the original sender email from a forwarded message body.
 * Looks for "From: Name <email>" or "From: email" patterns after
 * "Forwarded message" markers.
 */
export function extractForwardedSender(bodyText: string): string | null {
  // Match "---------- Forwarded message ---------" then "From: ... <email>"
  const fwdBlock = bodyText.match(
    /[-]+\s*Forwarded message\s*[-]+[\s\S]{0,200}?From:\s*(?:[^<\n]*<)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/i,
  )
  if (fwdBlock) return fwdBlock[1].toLowerCase()

  return null
}

// ---------------------------------------------------------------------------
// classifyByPattern
// ---------------------------------------------------------------------------

export type PatternClassification = 'definite' | 'uncertain' | 'irrelevant'

/**
 * Classifies an email by sender domain and subject keywords.
 * For forwarded emails, also checks the original sender extracted from the body.
 */
export function classifyByPattern(
  fromEmail: string,
  subject: string,
  bodyText?: string,
): PatternClassification {
  const combined = `${fromEmail} ${subject}`

  // Exclude check first
  if (containsAny(combined, EXCLUDE_KEYWORDS)) {
    return 'irrelevant'
  }

  // Check direct sender and original forwarded sender
  let knownSender = isKnownSender(fromEmail)
  if (!knownSender && bodyText) {
    const originalSender = extractForwardedSender(bodyText)
    if (originalSender) {
      knownSender = isKnownSender(originalSender)
    }
  }

  const hasKeyword = hasSubjectKeyword(subject)

  if (knownSender && hasKeyword) return 'definite'
  if (knownSender || hasKeyword) return 'uncertain'
  return 'irrelevant'
}

// ---------------------------------------------------------------------------
// buildSearchQuery
// ---------------------------------------------------------------------------

export function buildSearchQuery(lastScanAt: string | null): string {
  // Date filter
  let dateFilter: string
  if (lastScanAt) {
    // Convert ISO date to Gmail's after:YYYY/MM/DD format
    const d = new Date(lastScanAt)
    const yyyy = d.getUTCFullYear()
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(d.getUTCDate()).padStart(2, '0')
    dateFilter = `after:${yyyy}/${mm}/${dd}`
  } else {
    // Default: last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const yyyy = sixMonthsAgo.getUTCFullYear()
    const mm = String(sixMonthsAgo.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(sixMonthsAgo.getUTCDate()).padStart(2, '0')
    dateFilter = `after:${yyyy}/${mm}/${dd}`
  }

  // Sender OR group
  const fromParts = KNOWN_SENDER_DOMAINS.map((d) => `from:${d}`)
  const fromGroup = `{${fromParts.join(' ')}}`

  // Subject keyword OR group (English + Hebrew for Gmail search)
  const subjectParts = [
    ...SUBJECT_KEYWORDS_EN.map((kw) => `subject:"${kw}"`),
    ...SUBJECT_KEYWORDS_HE.map((kw) => `subject:"${kw}"`),
  ]
  const subjectGroup = `{${subjectParts.join(' ')}}`

  // Exclude keywords
  const excludeParts = EXCLUDE_KEYWORDS.map((kw) => `-"${kw}"`)
  const excludeStr = excludeParts.join(' ')

  return `(${fromGroup} OR ${subjectGroup}) ${excludeStr} ${dateFilter}`
}

// ---------------------------------------------------------------------------
// extractBookingRefs
// ---------------------------------------------------------------------------

// Common words that appear in ALL CAPS in travel emails but aren't booking refs
const BOOKING_REF_STOPWORDS = new Set([
  'CAMPGROUND',
  'WATCHMAN',
  'NATIONAL',
  'VEHICLE',
  'EQUIPMENT',
  'CAMPING',
  'RESERVATION',
  'DETAILS',
  'CANCEL',
  'REFUND',
  'OCCUPANT',
  'OCCUPANTS',
  'CHECKOUT',
  'CHECKIN',
  'CONFIRMATION',
  'IMPORTANT',
  'NOTICE',
  'SUBJECT',
  'INFORMATION',
  'AVAILABLE',
  'PERMITTED',
  'PROHIBITED',
  'FIREWOOD',
  'WILDLIFE',
  'CAMPFIRE',
  'SUPPORT',
  'CONTACT',
  'RECEIPT',
  'PAYMENT',
  'BOOKING',
  'TRAVEL',
  'FLIGHT',
  'HOTEL',
  'RENTAL',
  'INSURANCE',
  'ENTRANCE',
  'TUNNEL',
  'PARKING',
  'SHOWER',
  'LAUNDRY',
  'GENERATOR',
  'HAMMOCK',
  'HAMMOCKS',
  'GARBAGE',
  'RECREATION',
  'VISITOR',
  'VISITORS',
  'RESERVED',
  'MODIFY',
  'ORDER',
  'ITINERARY',
  'AIRLINES',
  'UNITED',
  'PASSES',
  'SENIOR',
  'POLICY',
  'POLICIES',
  'RIGHTS',
  'PLEASE',
  'SERVICE',
  'IMAGES',
  'PHOTO',
  'ALERT',
  'HELLO',
  'THANK',
  'THANKS',
  'TRAIL',
  'TRAILS',
  'CANYON',
  'CREEK',
  'GRANT',
  'LODGE',
  'INDIAN',
  'YELLOW',
  'STONE',
  'BRYCE',
  'JACKSON',
])

export function extractBookingRefs(text: string): string[] {
  const refs = new Set<string>()

  // Pattern 1: uppercase alphanumeric 5–10 chars (standalone token)
  // Must contain at least one digit OR not be a common English word
  const alphanumRegex = /\b([A-Z][A-Z0-9]{4,9})\b/g
  let m: RegExpExecArray | null
  while ((m = alphanumRegex.exec(text)) !== null) {
    const token = m[1]
    if (BOOKING_REF_STOPWORDS.has(token)) continue
    // Pure alphabetic tokens over 7 chars are likely words, not booking refs
    if (/^[A-Z]+$/.test(token) && token.length > 7) continue
    refs.add(token)
  }

  // Pattern 2: # followed by 6+ digits
  const hashNumRegex = /#(\d{6,})/g
  while ((m = hashNumRegex.exec(text)) !== null) {
    refs.add('#' + m[1])
  }

  // Pattern 3: order/confirmation/booking/ref followed by optional separator and digits/alphanum
  const labelRegex = /(?:order|confirmation|booking|ref(?:erence)?)\s*[:#\-\s]+([A-Z0-9]{4,})/gi
  while ((m = labelRegex.exec(text)) !== null) {
    refs.add(m[1].toUpperCase())
  }

  return Array.from(refs)
}
