// bookingMatch.ts — Pure matching logic for reconciling scanned booking emails
// against existing campsite_bookings rows.
//
// Kept free of Deno and Supabase imports so it can run under vitest: the
// Newark incident (a manual booking still naming a Denver hotel days after
// Booking.com had rebooked the family into Newark) was invisible precisely
// because nothing here was testable.

export interface BookingChange {
  field: string
  old_value: string
  new_value: string
  changed_at: string
}

export interface ExistingBookingSnapshot {
  id: string
  check_in: string
  location: string
  status?: string | null
  confirmation?: string | null
  cost?: number | null
  cancellation_deadline?: string | null
  document_id?: string | null
  notes?: string | null
  changelog?: BookingChange[] | null
}

export interface IncomingBooking {
  location: string
  confirmation?: string | null
  amount?: number | null
  expiryDate?: string | null
  documentId?: string | null
}

export interface BookingConflict {
  bookingId: string
  checkIn: string
  currentLocation: string
  incomingLocation: string
  confirmation: string | null
  documentId: string | null
}

export type ManualBookingPlan =
  | { action: 'none' }
  | { action: 'enrich'; updates: Record<string, unknown>; changes: BookingChange[] }
  | {
      action: 'conflict'
      updates: Record<string, unknown>
      changes: BookingChange[]
      conflict: BookingConflict
    }

/** Field name used in the changelog for a flagged, unapplied replacement. */
export const PENDING_REPLACEMENT_FIELD = 'pending_replacement'

// Words that carry no identity: brand filler plus the noise an email subject
// drags in ("Fwd: Thanks! Your booking is confirmed at ...").
const NOISE_TOKENS = new Set([
  'a',
  'an',
  'and',
  'at',
  'by',
  'for',
  'in',
  'is',
  'of',
  'on',
  'the',
  'to',
  'your',
  'hotel',
  'hotels',
  'booking',
  'bookings',
  'com',
  'confirmation',
  'confirmed',
  'reservation',
  'reserved',
  'fwd',
  'fw',
  're',
  'thanks',
  'thank',
  'you',
  'stay',
  'nights',
  'night',
])

/** Lowercased identity tokens of a property name, noise removed. */
export function propertyTokens(name: string): string[] {
  return (name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9֐-׿]+/g, ' ')
    .split(' ')
    .filter((t) => t.length > 1 && !NOISE_TOKENS.has(t))
}

// Tokens that separate two properties of the same brand in the same city
// ("Staybridge Suites Denver Downtown" is not the airport one). A disagreement
// on any of these means a different property, however similar the rest reads.
const QUALIFIER_TOKENS = new Set([
  'airport',
  'downtown',
  'uptown',
  'midtown',
  'central',
  'centre',
  'center',
  'north',
  'south',
  'east',
  'west',
  'northeast',
  'northwest',
  'southeast',
  'southwest',
  'beach',
  'harbor',
  'harbour',
  'riverside',
  'lakeside',
  'station',
  'terminal',
  'convention',
  'stadium',
  'university',
  'mall',
  'village',
  'valley',
  'canyon',
])

/**
 * Dice coefficient over identity tokens, with a veto on mismatched location
 * qualifiers. 0.7 is deliberately strict: matching too eagerly enriches the
 * wrong booking silently, while failing to match only raises a conflict the
 * family gets to resolve.
 */
export function isSameProperty(a: string, b: string): boolean {
  const setA = new Set(propertyTokens(a))
  const setB = new Set(propertyTokens(b))
  if (setA.size === 0 || setB.size === 0) return false

  let shared = 0
  for (const token of setA) {
    if (setB.has(token)) shared++
    else if (QUALIFIER_TOKENS.has(token)) return false
  }
  for (const token of setB) {
    if (!setA.has(token) && QUALIFIER_TOKENS.has(token)) return false
  }

  return (2 * shared) / (setA.size + setB.size) >= 0.7
}

function formatDate(iso: string): string {
  const [y, m, d] = (iso ?? '').split('T')[0].split('-')
  return y && m && d ? `${d}/${m}/${y}` : iso
}

/** Hebrew note appended to a manual booking whose property no longer matches. */
export function buildConflictNote(checkIn: string, incoming: IncomingBooking): string {
  const rlm = '\u200F'
  let note = `⚠️ סריקת מייל מצאה הזמנה עדכנית לתאריך ${formatDate(checkIn)}${rlm} במקום ${incoming.location}${rlm}`
  if (incoming.confirmation) {
    note += `, מספר אישור ${incoming.confirmation}${rlm}`
  }
  note += '. ההזמנה הידנית לא שונתה. יש לבדוק ולהחליף ידנית.'
  return note
}

/**
 * Decides what a scanned confirmation may do to a MANUAL booking on the same
 * night. Manual data is sacred: a different property is never overwritten, it
 * is flagged. A matching property is only enriched, and every change is
 * recorded in the changelog.
 */
export function planManualBookingUpdate(
  existing: ExistingBookingSnapshot,
  incoming: IncomingBooking,
  now: string,
): ManualBookingPlan {
  const changes: BookingChange[] = []
  const updates: Record<string, unknown> = {}

  if (!isSameProperty(existing.location, incoming.location)) {
    // Already flagged by an earlier scan? Do not stack duplicate warnings.
    const alreadyFlagged = (existing.changelog ?? []).some(
      (entry) =>
        entry.field === PENDING_REPLACEMENT_FIELD &&
        isSameProperty(entry.new_value, incoming.location),
    )
    if (alreadyFlagged) return { action: 'none' }

    changes.push({
      field: PENDING_REPLACEMENT_FIELD,
      old_value: existing.location,
      new_value: incoming.confirmation
        ? `${incoming.location} (${incoming.confirmation})`
        : incoming.location,
      changed_at: now,
    })

    const note = buildConflictNote(existing.check_in, incoming)
    updates.notes = existing.notes ? `${existing.notes}\n\n${note}` : note

    return {
      action: 'conflict',
      updates,
      changes,
      conflict: {
        bookingId: existing.id,
        checkIn: existing.check_in,
        currentLocation: existing.location,
        incomingLocation: incoming.location,
        confirmation: incoming.confirmation ?? null,
        documentId: incoming.documentId ?? null,
      },
    }
  }

  // Same property: the email is authoritative for the confirmation number,
  // including when the booking was already marked confirmed under an older
  // number. That case used to be dropped on the floor.
  if (incoming.confirmation && incoming.confirmation !== existing.confirmation) {
    updates.confirmation = incoming.confirmation
    updates.status = 'confirmed'
    changes.push({
      field: 'confirmation',
      old_value: existing.confirmation ?? '',
      new_value: incoming.confirmation,
      changed_at: now,
    })
  } else if (incoming.confirmation && existing.status !== 'confirmed') {
    updates.status = 'confirmed'
    changes.push({
      field: 'status',
      old_value: existing.status ?? '',
      new_value: 'confirmed',
      changed_at: now,
    })
  }

  // Never rewrite a cost or deadline the family typed; only fill the blanks.
  if (incoming.amount && !existing.cost) {
    updates.cost = incoming.amount
    changes.push({
      field: 'cost',
      old_value: '',
      new_value: String(incoming.amount),
      changed_at: now,
    })
  }

  if (incoming.expiryDate && !existing.cancellation_deadline) {
    updates.cancellation_deadline = incoming.expiryDate
    changes.push({
      field: 'cancellation_deadline',
      old_value: '',
      new_value: incoming.expiryDate,
      changed_at: now,
    })
  }

  if (incoming.documentId && !existing.document_id) {
    updates.document_id = incoming.documentId
    changes.push({
      field: 'document_id',
      old_value: '',
      new_value: incoming.documentId,
      changed_at: now,
    })
  }

  if (Object.keys(updates).length === 0) return { action: 'none' }

  return { action: 'enrich', updates, changes }
}
