import { describe, it, expect } from 'vitest'
import {
  isSameProperty,
  planManualBookingUpdate,
  PENDING_REPLACEMENT_FIELD,
  type ExistingBookingSnapshot,
} from '../bookingMatch'

// Day 1 of the trip was booked manually at a Denver hotel. Booking.com later
// rebooked the family into Newark and the scanner imported the new email as a
// document, but left the booking naming Denver. The app then told them, on the
// day of the flight, that they were sleeping in the wrong city.

const NOW = '2026-09-01T10:00:00Z'

const manualDenver: ExistingBookingSnapshot = {
  id: 'camp-01',
  check_in: '2026-09-10',
  location: 'Staybridge Suites Denver International Airport',
  status: 'confirmed',
  confirmation: 'OLD-123',
  cost: 210,
  cancellation_deadline: null,
  document_id: 'doc-old',
  notes: 'הזמנה ידנית',
  changelog: [],
}

describe('isSameProperty', () => {
  it('matches the same hotel written two different ways', () => {
    expect(
      isSameProperty(
        'DoubleTree by Hilton Hotel Newark Airport',
        'Fwd: Thanks! Your booking is confirmed at DoubleTree Hilton Newark Airport',
      ),
    ).toBe(true)
  })

  it('does not match two different hotels that share a city and an airport', () => {
    expect(
      isSameProperty(
        'Staybridge Suites Denver International Airport',
        'DoubleTree by Hilton Hotel Newark Airport',
      ),
    ).toBe(false)
  })

  it('does not match two properties of the same brand in the same city', () => {
    expect(
      isSameProperty('Staybridge Suites Denver Downtown', 'Staybridge Suites Denver Airport'),
    ).toBe(false)
  })

  it('treats an empty name as no match rather than a match with everything', () => {
    expect(isSameProperty('', 'DoubleTree Newark')).toBe(false)
  })
})

describe('planManualBookingUpdate', () => {
  it('flags a different property instead of overwriting the manual booking', () => {
    const plan = planManualBookingUpdate(
      manualDenver,
      {
        location: 'DoubleTree by Hilton Hotel Newark Airport',
        confirmation: '5356965270',
        amount: 265.3,
        expiryDate: '2026-09-11',
        documentId: 'doc-new',
      },
      NOW,
    )

    expect(plan.action).toBe('conflict')
    if (plan.action !== 'conflict') return

    // Nothing the family typed is touched.
    expect(plan.updates.location).toBeUndefined()
    expect(plan.updates.confirmation).toBeUndefined()
    expect(plan.updates.cost).toBeUndefined()

    expect(plan.conflict).toMatchObject({
      bookingId: 'camp-01',
      currentLocation: 'Staybridge Suites Denver International Airport',
      incomingLocation: 'DoubleTree by Hilton Hotel Newark Airport',
      confirmation: '5356965270',
    })
    expect(String(plan.updates.notes)).toContain('הזמנה ידנית')
    expect(String(plan.updates.notes)).toContain('DoubleTree by Hilton Hotel Newark Airport')
    expect(plan.changes[0].field).toBe(PENDING_REPLACEMENT_FIELD)
  })

  it('does not re-flag a conflict an earlier scan already recorded', () => {
    const plan = planManualBookingUpdate(
      {
        ...manualDenver,
        changelog: [
          {
            field: PENDING_REPLACEMENT_FIELD,
            old_value: manualDenver.location,
            new_value: 'DoubleTree by Hilton Hotel Newark Airport (5356965270)',
            changed_at: NOW,
          },
        ],
      },
      { location: 'DoubleTree by Hilton Hotel Newark Airport', confirmation: '5356965270' },
      NOW,
    )

    expect(plan.action).toBe('none')
  })

  it('adopts a new confirmation number for the same property', () => {
    const plan = planManualBookingUpdate(
      manualDenver,
      { location: 'Staybridge Suites Denver International Airport', confirmation: 'NEW-999' },
      NOW,
    )

    expect(plan.action).toBe('enrich')
    if (plan.action !== 'enrich') return
    expect(plan.updates.confirmation).toBe('NEW-999')
    expect(plan.updates.status).toBe('confirmed')
    expect(plan.changes).toContainEqual({
      field: 'confirmation',
      old_value: 'OLD-123',
      new_value: 'NEW-999',
      changed_at: NOW,
    })
  })

  it('fills blanks but never rewrites a cost the family entered', () => {
    const plan = planManualBookingUpdate(
      { ...manualDenver, cost: 210, cancellation_deadline: null, document_id: null },
      {
        location: 'Staybridge Suites Denver International Airport',
        confirmation: 'OLD-123',
        amount: 999,
        expiryDate: '2026-09-08',
        documentId: 'doc-new',
      },
      NOW,
    )

    expect(plan.action).toBe('enrich')
    if (plan.action !== 'enrich') return
    expect(plan.updates.cost).toBeUndefined()
    expect(plan.updates.cancellation_deadline).toBe('2026-09-08')
    expect(plan.updates.document_id).toBe('doc-new')
  })

  it('reports nothing to do when the email repeats what is already stored', () => {
    const plan = planManualBookingUpdate(
      { ...manualDenver, cancellation_deadline: '2026-09-08' },
      {
        location: 'Staybridge Suites Denver International Airport',
        confirmation: 'OLD-123',
        amount: 210,
        expiryDate: '2026-09-08',
        documentId: 'doc-old',
      },
      NOW,
    )

    expect(plan.action).toBe('none')
  })
})
