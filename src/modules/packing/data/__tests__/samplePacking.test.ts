import { SAMPLE_PACKING_ITEMS } from '@/modules/packing/data/samplePacking'
import type { FamilyMemberId } from '@/lib/types'

const VALID_CATEGORIES = [
  'clothing',
  'toiletries',
  'electronics',
  'documents',
  'medicine',
  'entertainment',
  'snacks',
]

const VALID_MEMBERS: FamilyMemberId[] = ['aba', 'ima', 'kid1', 'kid2', 'kid3', 'moti']

describe('SAMPLE_PACKING_ITEMS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(SAMPLE_PACKING_ITEMS)).toBe(true)
    expect(SAMPLE_PACKING_ITEMS.length).toBeGreaterThan(0)
  })

  it.each(SAMPLE_PACKING_ITEMS.map((item) => [item.id, item]))(
    'item %s has all required fields',
    (_id, item) => {
      expect(typeof item.id).toBe('string')
      expect(item.id.length).toBeGreaterThan(0)
      expect(typeof item.name).toBe('string')
      expect(item.name.length).toBeGreaterThan(0)
      expect(typeof item.category).toBe('string')
      expect(typeof item.assigned_to).toBe('string')
      expect(typeof item.is_packed).toBe('boolean')
      expect(typeof item.quantity).toBe('number')
      expect(item.quantity).toBeGreaterThan(0)
    },
  )

  it('all categories are valid', () => {
    for (const item of SAMPLE_PACKING_ITEMS) {
      expect(VALID_CATEGORIES).toContain(item.category)
    }
  })

  it('all assigned_to values are valid family member ids', () => {
    for (const item of SAMPLE_PACKING_ITEMS) {
      expect(VALID_MEMBERS).toContain(item.assigned_to)
    }
  })

  it('all items have unique ids', () => {
    const ids = SAMPLE_PACKING_ITEMS.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has both packed and unpacked items', () => {
    const packed = SAMPLE_PACKING_ITEMS.filter((item) => item.is_packed)
    const unpacked = SAMPLE_PACKING_ITEMS.filter((item) => !item.is_packed)
    expect(packed.length).toBeGreaterThan(0)
    expect(unpacked.length).toBeGreaterThan(0)
  })

  it('covers multiple categories', () => {
    const categories = new Set(SAMPLE_PACKING_ITEMS.map((item) => item.category))
    expect(categories.size).toBeGreaterThanOrEqual(5)
  })
})
