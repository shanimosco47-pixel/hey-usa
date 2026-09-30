import { describe, it, expect, vi } from 'vitest'
import { SAMPLE_EXPENSES } from '@/modules/budget/data/sampleExpenses'

const upserts: Record<string, unknown> = {}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      upsert: (payload: unknown) => {
        upserts[table] = payload
        return Promise.resolve({ data: null, error: null })
      },
    }),
  },
}))

describe('seedAllData expenses', () => {
  it('writes each sample expense with its day link', async () => {
    const { seedAllData } = await import('@/lib/database')
    await seedAllData()

    const rows = upserts.expenses as Array<{ id: string; day_id: string | null }>
    expect(rows).toHaveLength(SAMPLE_EXPENSES.length)
    for (const e of SAMPLE_EXPENSES) {
      expect(rows.find((r) => r.id === e.id)?.day_id).toBe(e.day_id ?? null)
    }
    expect(rows.some((r) => r.day_id !== null)).toBe(true)
  })
})
