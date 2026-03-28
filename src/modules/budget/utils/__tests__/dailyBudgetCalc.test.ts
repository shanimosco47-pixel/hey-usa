import { calculateDailyBudget } from '../dailyBudgetCalc'
import type { ItineraryDay, Expense } from '@/lib/types'

// Mock the locations module to avoid pulling in all location data
vi.mock('@/data/locations', () => ({
  getPrimaryLocationForCity: () => undefined,
}))

function makeDay(overrides: Partial<ItineraryDay> & { id: string; date: string }): ItineraryDay {
  return {
    title: 'Test Day',
    stops: [],
    ...overrides,
  }
}

function makeExpense(overrides: Partial<Expense> & { id: string; amount: number }): Expense {
  return {
    title: 'Test Expense',
    currency: 'USD',
    category: 'other',
    paid_by: 'aba',
    date: '2026-09-10',
    created_at: '2026-09-10T00:00:00Z',
    ...overrides,
  }
}

describe('calculateDailyBudget', () => {
  it('returns correct planned totals from stop cost_estimate', () => {
    const days: ItineraryDay[] = [
      makeDay({
        id: 'day-1',
        date: '2026-09-10',
        stops: [
          { id: 's1', title: 'Museum', category: 'attraction', cost_estimate: 50, order: 1 },
          { id: 's2', title: 'Drive', category: 'drive', cost_estimate: 30, order: 2 },
          { id: 's3', title: 'Camp', category: 'camp', cost_estimate: 40, order: 3 },
        ],
      }),
    ]

    const result = calculateDailyBudget(days, [])

    expect(result).toHaveLength(1)
    expect(result[0].plannedActivities).toBe(50)
    expect(result[0].plannedDriving).toBe(30)
    expect(result[0].plannedTotal).toBe(120) // 50 + 30 + 40
  })

  it('accumulates running totals correctly across days', () => {
    const days: ItineraryDay[] = [
      makeDay({
        id: 'day-1',
        date: '2026-09-10',
        stops: [{ id: 's1', title: 'A', category: 'attraction', cost_estimate: 100, order: 1 }],
      }),
      makeDay({
        id: 'day-2',
        date: '2026-09-11',
        stops: [{ id: 's2', title: 'B', category: 'attraction', cost_estimate: 200, order: 1 }],
      }),
    ]

    const expenses: Expense[] = [
      makeExpense({ id: 'e1', amount: 80, day_id: 'day-1' }),
      makeExpense({ id: 'e2', amount: 150, date: '2026-09-11' }),
    ]

    const result = calculateDailyBudget(days, expenses)

    expect(result[0].runningPlanned).toBe(100)
    expect(result[0].runningActual).toBe(80)
    expect(result[1].runningPlanned).toBe(300) // 100 + 200
    expect(result[1].runningActual).toBe(230) // 80 + 150
  })

  it('calculates delta as planned minus actual', () => {
    const days: ItineraryDay[] = [
      makeDay({
        id: 'day-1',
        date: '2026-09-10',
        stops: [{ id: 's1', title: 'A', category: 'attraction', cost_estimate: 100, order: 1 }],
      }),
    ]

    const expenses: Expense[] = [makeExpense({ id: 'e1', amount: 120, day_id: 'day-1' })]

    const result = calculateDailyBudget(days, expenses)

    expect(result[0].delta).toBe(-20) // 100 - 120
  })

  it('handles empty days (no stops)', () => {
    const days: ItineraryDay[] = [makeDay({ id: 'day-1', date: '2026-09-10', stops: [] })]

    const result = calculateDailyBudget(days, [])

    expect(result).toHaveLength(1)
    expect(result[0].plannedTotal).toBe(0)
    expect(result[0].actualTotal).toBe(0)
    expect(result[0].delta).toBe(0)
  })

  it('handles empty expenses', () => {
    const days: ItineraryDay[] = [
      makeDay({
        id: 'day-1',
        date: '2026-09-10',
        stops: [{ id: 's1', title: 'A', category: 'attraction', cost_estimate: 50, order: 1 }],
      }),
    ]

    const result = calculateDailyBudget(days, [])

    expect(result[0].actualTotal).toBe(0)
    expect(result[0].delta).toBe(50)
  })

  it('returns empty array for empty days input', () => {
    const result = calculateDailyBudget([], [])
    expect(result).toEqual([])
  })

  it('matches expenses by day_id or date', () => {
    const days: ItineraryDay[] = [
      makeDay({
        id: 'day-1',
        date: '2026-09-10',
        stops: [],
      }),
    ]

    const expenses: Expense[] = [
      makeExpense({ id: 'e1', amount: 25, day_id: 'day-1', date: '2026-09-09' }),
      makeExpense({ id: 'e2', amount: 30, date: '2026-09-10' }),
    ]

    const result = calculateDailyBudget(days, expenses)

    // e1 matches by day_id, e2 matches by date
    expect(result[0].actualTotal).toBe(55)
  })

  it('identifies accommodation from camp stops', () => {
    const days: ItineraryDay[] = [
      makeDay({
        id: 'day-1',
        date: '2026-09-10',
        stops: [
          { id: 's1', title: 'Yosemite Campground', category: 'camp', cost_estimate: 35, order: 1 },
        ],
      }),
    ]

    const result = calculateDailyBudget(days, [])

    expect(result[0].accommodation).toEqual({ name: 'Yosemite Campground', cost: 35 })
  })

  it('sets dayNumber based on array index', () => {
    const days: ItineraryDay[] = [
      makeDay({ id: 'day-1', date: '2026-09-10' }),
      makeDay({ id: 'day-2', date: '2026-09-11' }),
      makeDay({ id: 'day-3', date: '2026-09-12' }),
    ]

    const result = calculateDailyBudget(days, [])

    expect(result[0].dayNumber).toBe(1)
    expect(result[1].dayNumber).toBe(2)
    expect(result[2].dayNumber).toBe(3)
  })
})
