import { cn } from '@/lib/cn'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes via clsx', () => {
    const isHidden = false
    expect(cn('base', isHidden && 'hidden', 'visible')).toBe('base visible')
  })

  it('merges conflicting Tailwind classes (last wins)', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2')
  })

  it('merges conflicting Tailwind bg classes', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('returns empty string for no input', () => {
    expect(cn()).toBe('')
  })

  it('handles undefined and null values', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })

  it('handles array input', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('handles object input', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
  })
})
