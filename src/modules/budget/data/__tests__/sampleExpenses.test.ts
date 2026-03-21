import { SAMPLE_BUDGET_SETTINGS, SAMPLE_EXPENSES } from '@/modules/budget/data/sampleExpenses'

const VALID_CATEGORIES = [
  'flights',
  'accommodation',
  'food',
  'transport',
  'attractions',
  'shopping',
  'communication',
  'insurance',
  'other',
]

describe('SAMPLE_BUDGET_SETTINGS', () => {
  it('has a positive total_budget', () => {
    expect(SAMPLE_BUDGET_SETTINGS.total_budget).toBeGreaterThan(0)
  })

  it('has a currency string', () => {
    expect(typeof SAMPLE_BUDGET_SETTINGS.currency).toBe('string')
    expect(SAMPLE_BUDGET_SETTINGS.currency.length).toBeGreaterThan(0)
  })

  it('has an alert_threshold between 0 and 1', () => {
    expect(SAMPLE_BUDGET_SETTINGS.alert_threshold).toBeGreaterThan(0)
    expect(SAMPLE_BUDGET_SETTINGS.alert_threshold).toBeLessThanOrEqual(1)
  })

  it('has category_budgets that are all positive numbers', () => {
    const budgets = SAMPLE_BUDGET_SETTINGS.category_budgets
    expect(Object.keys(budgets).length).toBeGreaterThan(0)
    for (const [key, value] of Object.entries(budgets)) {
      expect(typeof key).toBe('string')
      expect(value).toBeGreaterThan(0)
    }
  })

  it('has category_budgets that sum to roughly the total_budget', () => {
    const sum = Object.values(SAMPLE_BUDGET_SETTINGS.category_budgets).reduce((a, b) => a + b, 0)
    expect(sum).toBe(SAMPLE_BUDGET_SETTINGS.total_budget)
  })
})

describe('SAMPLE_EXPENSES', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(SAMPLE_EXPENSES)).toBe(true)
    expect(SAMPLE_EXPENSES.length).toBeGreaterThan(0)
  })

  it.each(SAMPLE_EXPENSES.map((e) => [e.id, e]))(
    'expense %s has all required fields',
    (_id, expense) => {
      expect(typeof expense.id).toBe('string')
      expect(expense.id.length).toBeGreaterThan(0)
      expect(typeof expense.title).toBe('string')
      expect(expense.title.length).toBeGreaterThan(0)
      expect(typeof expense.amount).toBe('number')
      expect(expense.amount).toBeGreaterThan(0)
      expect(typeof expense.category).toBe('string')
      expect(typeof expense.created_at).toBe('string')
    },
  )

  it('all expense categories are valid', () => {
    for (const expense of SAMPLE_EXPENSES) {
      expect(VALID_CATEGORIES).toContain(expense.category)
    }
  })

  it('all expenses have unique ids', () => {
    const ids = SAMPLE_EXPENSES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
