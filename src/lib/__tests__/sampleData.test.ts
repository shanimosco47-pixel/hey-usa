import { isSampleData } from '@/lib/sampleData'

describe('isSampleData', () => {
  it('returns true for sample document ids', () => {
    expect(isSampleData('doc-123')).toBe(true)
  })

  it('returns true for sample photo ids', () => {
    expect(isSampleData('photo-abc')).toBe(true)
  })

  it('returns true for sample expense ids', () => {
    expect(isSampleData('expense-1')).toBe(true)
  })

  it('returns true for sample task ids', () => {
    expect(isSampleData('task-42')).toBe(true)
  })

  it('returns true for sample blog post ids', () => {
    expect(isSampleData('post-hello')).toBe(true)
  })

  it('returns true for sample song ids', () => {
    expect(isSampleData('song-1')).toBe(true)
  })

  it('returns true for sample packing item ids', () => {
    expect(isSampleData('p-shirt')).toBe(true)
  })

  it('returns true for sample note ids', () => {
    expect(isSampleData('note-sample-1')).toBe(true)
  })

  it('returns false for user-generated ids', () => {
    expect(isSampleData('abc-123')).toBe(false)
    expect(isSampleData('my-custom-id')).toBe(false)
    expect(isSampleData('')).toBe(false)
  })

  it('returns false for ids that contain but do not start with prefixes', () => {
    expect(isSampleData('x-doc-123')).toBe(false)
    expect(isSampleData('my-task-1')).toBe(false)
  })
})
