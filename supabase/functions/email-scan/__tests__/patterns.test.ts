import { describe, it, expect } from 'vitest'
import { classifyByPattern, buildSearchQuery } from '../patterns'

// The scanner once turned a recreation.gov advert into a campsite booking for
// 4 July, an evening nobody was travelling. These tests pin the behaviour that
// prevents it, because the failure is silent: a wrong booking looks exactly
// like a right one until someone drives to the campground.

describe('classifyByPattern', () => {
  it('accepts a real reservation from a known transactional sender', () => {
    expect(
      classifyByPattern(
        'communications@recreation.gov',
        'Reservation Confirmation',
        'This email confirms your reservation 0843971162-1 for 1 nights at WATCHMAN CAMPGROUND',
      ),
    ).toBe('definite')
  })

  it('rejects marketing from the same domain as real confirmations', () => {
    // The exact email that became a bogus booking.
    expect(
      classifyByPattern(
        'AdventureAwaits@recreation.gov',
        'Long Weekend? Nature is Calling!',
        'Grab Your Weekend Spot',
      ),
    ).toBe('irrelevant')
  })

  it.each([
    'deals@united.com',
    'news@booking.com',
    'Offers@expedia.com',
    'adventure.awaits@recreation.gov',
    'marketing@airbnb.com',
  ])('treats %s as bulk mail regardless of domain reputation', (sender) => {
    expect(classifyByPattern(sender, 'Campsites available near you', '')).toBe('irrelevant')
  })

  it('still rejects on explicit exclude keywords', () => {
    expect(classifyByPattern('communications@recreation.gov', 'Our monthly newsletter', '')).toBe(
      'irrelevant',
    )
  })

  it('ignores senders with no relationship to travel', () => {
    expect(classifyByPattern('shop@beauty.sephora.com', 'Double up on hydration', '')).toBe(
      'irrelevant',
    )
  })

  it('does not veto a personal forwarder whose name contains a marketing word', () => {
    // The marketing veto must never fire before the forwarded-sender lookup.
    // Bookings for this trip arrive forwarded from personal mailboxes, and a
    // bare substring match would bin a real confirmation because the sender is
    // called Discover, Newsome, or similar.
    expect(
      classifyByPattern(
        'Discover.Danit@gmail.com',
        'Fwd: Reservation Confirmation',
        '---------- Forwarded message ---------\nFrom: Recreation.gov <communications@recreation.gov>\nYour Reservation Details!',
      ),
    ).toBe('definite')
  })

  it('does not veto an unknown-domain sender on local part alone', () => {
    expect(classifyByPattern('news.danit@gmail.com', 'Reservation Confirmation', '')).toBe(
      'uncertain',
    )
  })

  it('picks up a confirmation forwarded from another mailbox', () => {
    // Bookings for this trip were made on a second account and forwarded on,
    // so the original sender has to be read out of the body.
    expect(
      classifyByPattern(
        'someone@gmail.com',
        'Fwd: Reservation Confirmation',
        '---------- Forwarded message ---------\nFrom: Recreation.gov <communications@recreation.gov>\nYour Reservation Details!',
      ),
    ).toBe('definite')
  })
})

describe('buildSearchQuery', () => {
  it('constrains the window when a last-scan timestamp is supplied', () => {
    expect(buildSearchQuery('2026-07-11T15:32:15.201Z')).toContain('after:2026/07/11')
  })

  it('falls back to a 12-month window so bookings made far ahead are still found', () => {
    const query = buildSearchQuery(null)
    const match = query.match(/after:(\d{4})\/(\d{2})\/(\d{2})/)
    expect(match).not.toBeNull()

    const start = new Date(`${match![1]}-${match![2]}-${match![3]}T00:00:00Z`)
    const monthsBack = (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    expect(monthsBack).toBeGreaterThan(11)
    expect(monthsBack).toBeLessThan(13)
  })
})
