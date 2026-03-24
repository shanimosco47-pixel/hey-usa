// importer.ts — Document import module for the email scan pipeline

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SupabaseClient = ReturnType<typeof createClient>

export interface ImportedDoc {
  title: string
  category: string
  locationId: string | null
  amount: number | null
  currency: string | null
  fileUrl: string | null
  fileType: string | null
  fileSize: number | null
  notes: string
  sourceEmailId: string
  checkInDate?: string | null
  expiryDate: string | null
  familyMemberId: string | null
}

export interface ImportResult {
  documentId: string
  title: string
  category: string
  amount: number | null
  currency: string | null
}

// ---------------------------------------------------------------------------
// Category emoji map (Hebrew notifications)
// ---------------------------------------------------------------------------

const CATEGORY_EMOJI: Record<string, string> = {
  flight_booking: '✈️',
  hotel_booking: '🏨',
  car_rental: '🚐',
  rv_rental: '🚐',
  campsite_reservation: '⛺',
  travel_insurance: '🛡️',
  attraction_ticket: '🎟️',
  visa: '📋',
  medical: '🏥',
  itinerary: '📋',
  receipt: '🧾',
  other_travel: '📄',
  other: '📄',
}

// Expense category mapping: documents category → expenses category
const EXPENSE_CATEGORY_MAP: Record<string, string> = {
  flight_booking: 'flights',
  hotel_booking: 'accommodation',
  car_rental: 'transport',
  rv_rental: 'transport',
  campsite_reservation: 'accommodation',
  travel_insurance: 'insurance',
  attraction_ticket: 'attractions',
  other_travel: 'other',
  other: 'other',
}

// ---------------------------------------------------------------------------
// Random 4-char suffix
// ---------------------------------------------------------------------------

function randomSuffix(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}

// ---------------------------------------------------------------------------
// importDocument
// ---------------------------------------------------------------------------

/**
 * Inserts a document into the documents table.
 * If amount > 0, also creates a corresponding expense.
 * Returns an ImportResult with the generated document ID.
 */
export async function importDocument(
  supabase: SupabaseClient,
  doc: ImportedDoc,
): Promise<ImportResult> {
  const documentId = `scan-${Date.now()}-${randomSuffix()}`
  const now = new Date().toISOString()

  // ------------------------------------------------------------------
  // Insert into documents table
  // ------------------------------------------------------------------
  const { error: docError } = await supabase.from('documents').insert({
    id: documentId,
    title: doc.title,
    category: doc.category,
    location_id: doc.locationId,
    family_member_id: doc.familyMemberId,
    file_url: doc.fileUrl,
    file_type: doc.fileType,
    file_size: doc.fileSize,
    notes: doc.notes || null,
    expiry_date: doc.expiryDate,
    source_email_id: doc.sourceEmailId,
    created_at: now,
    updated_at: now,
  })

  if (docError) {
    console.error('[importer] Failed to insert document:', docError.message)
    // Still return a result so the pipeline can continue
  }

  // ------------------------------------------------------------------
  // Insert expense if amount is present and positive
  // ------------------------------------------------------------------
  const amount = doc.amount ?? 0
  if (amount > 0) {
    const expenseCategory = EXPENSE_CATEGORY_MAP[doc.category] ?? 'other'

    const expenseId = `exp-${documentId}`
    const { error: expError } = await supabase.from('expenses').insert({
      id: expenseId,
      title: doc.title,
      amount: amount,
      currency: doc.currency ?? 'USD',
      category: expenseCategory,
      paid_by: 'aba',
      date: now.slice(0, 10), // YYYY-MM-DD
      notes: doc.notes || null,
      created_at: now,
    })

    if (expError) {
      console.error('[importer] Failed to insert expense:', expError.message)
    }
  }

  return {
    documentId,
    title: doc.title,
    category: doc.category,
    amount: doc.amount,
    currency: doc.currency,
  }
}

// ---------------------------------------------------------------------------
// importCampsiteBooking
// ---------------------------------------------------------------------------

/**
 * Creates a campsite_booking entry from hotel/campsite email documents.
 * Conflict resolution:
 * - Manual bookings are NEVER overwritten
 * - Existing email_scan bookings are updated
 * - New bookings are created with source='email_scan'
 */
export async function importCampsiteBooking(
  supabase: SupabaseClient,
  doc: ImportedDoc,
): Promise<void> {
  // Only process accommodation categories
  if (doc.category !== 'hotel_booking' && doc.category !== 'campsite_reservation') {
    return
  }

  const checkIn = doc.checkInDate ?? null
  const checkOut = doc.expiryDate ?? null

  // Must have at least one date
  if (!checkIn && !checkOut) {
    console.log('[importer] Skipping campsite import — no dates available')
    return
  }

  const now = new Date().toISOString()

  // --- Conflict Resolution ---
  // Check for existing booking by check_in date
  let existingBooking = null
  const searchDate = checkIn ?? checkOut

  if (searchDate) {
    const { data } = await supabase
      .from('campsite_bookings')
      .select('*')
      .eq('check_in', searchDate)
      .limit(5)

    if (data && data.length > 0) {
      existingBooking = data[0]
    }
  }

  // If a MANUAL booking exists → SKIP entirely (never overwrite)
  if (existingBooking && existingBooking.source !== 'email_scan') {
    console.log(
      `[importer] Skipping — manual booking exists for ${searchDate} at ${existingBooking.location}`,
    )
    return
  }

  // If an EMAIL_SCAN booking exists → UPDATE it
  if (existingBooking && existingBooking.source === 'email_scan') {
    const { error } = await supabase
      .from('campsite_bookings')
      .update({
        location: doc.title,
        check_out: checkOut ?? existingBooking.check_out,
        cost: doc.amount ?? existingBooking.cost,
        notes: doc.notes || existingBooking.notes,
        updated_at: now,
      })
      .eq('id', existingBooking.id)

    if (error) {
      console.error('[importer] Failed to update campsite booking:', error.message)
    } else {
      console.log(`[importer] Updated campsite booking: ${existingBooking.id}`)
    }
    return
  }

  // No match → CREATE new booking
  const bookingId = `camp-scan-${Date.now()}-${randomSuffix()}`
  const accommodationType = doc.category === 'hotel_booking' ? 'hotel' : 'campground'

  const { error } = await supabase.from('campsite_bookings').insert({
    id: bookingId,
    check_in: checkIn ?? checkOut,
    check_out: checkOut ?? checkIn,
    location: doc.title,
    area: '',
    type: accommodationType,
    priority: 'primary',
    status: 'pending',
    confirmation: null,
    cost: doc.amount,
    notes: doc.notes || null,
    source: 'email_scan',
    changelog: [],
    created_at: now,
    updated_at: now,
  })

  if (error) {
    console.error('[importer] Failed to insert campsite booking:', error.message)
  } else {
    console.log(`[importer] Created campsite booking: ${bookingId} for ${doc.title}`)
  }
}

// ---------------------------------------------------------------------------
// buildMotiNotification
// ---------------------------------------------------------------------------

/**
 * Builds a Hebrew notification message for Moti summarizing imported documents.
 */
export function buildMotiNotification(results: ImportResult[]): string {
  if (results.length === 0) {
    return 'סריקת אימייל הושלמה — לא נמצאו מסמכי נסיעה חדשים.'
  }

  const lines: string[] = []
  lines.push(
    `📬 סרקתי את האימיילים ומצאתי ${results.length} מסמך${results.length > 1 ? 'ים' : ''} חדש${results.length > 1 ? 'ים' : ''}:`,
  )
  lines.push('')

  for (const r of results) {
    const emoji = CATEGORY_EMOJI[r.category] ?? '📄'
    let line = `${emoji} ${r.title}`
    if (r.amount && r.amount > 0) {
      const currency = r.currency ?? ''
      line += ` — ${r.amount.toLocaleString('he-IL')} ${currency}`
    }
    lines.push(line)
  }

  lines.push('')
  lines.push('כל המסמכים נשמרו בלשונית המסמכים. בדוק שהכל נראה תקין! 👍')

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// postMotiMessage
// ---------------------------------------------------------------------------

/**
 * Inserts a message from Moti into the chat_messages table.
 */
export async function postMotiMessage(supabase: SupabaseClient, text: string): Promise<void> {
  const messageId = `moti-scan-${Date.now()}`
  const { error } = await supabase.from('chat_messages').insert({
    id: messageId,
    role: 'assistant',
    content: text,
    has_action: false,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error('[importer] Failed to post Moti message:', error.message)
  }
}
