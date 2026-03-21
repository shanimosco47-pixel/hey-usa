import { getFamilyMember, FAMILY_MEMBERS, NAV_ITEMS } from '@/constants'

describe('getFamilyMember', () => {
  it('returns the correct member for "aba"', () => {
    const member = getFamilyMember('aba')
    expect(member.id).toBe('aba')
    expect(member.name_en).toBe('Dad')
  })

  it('returns the correct member for "ima"', () => {
    const member = getFamilyMember('ima')
    expect(member.id).toBe('ima')
    expect(member.name_en).toBe('Mom')
  })

  it('returns the correct member for "kid1"', () => {
    const member = getFamilyMember('kid1')
    expect(member.id).toBe('kid1')
  })

  it('throws for an invalid id', () => {
    // @ts-expect-error testing invalid id
    expect(() => getFamilyMember('nobody')).toThrow('Unknown family member: nobody')
  })
})

describe('FAMILY_MEMBERS integrity', () => {
  const memberIds = Object.keys(FAMILY_MEMBERS) as Array<keyof typeof FAMILY_MEMBERS>

  it('has at least one member', () => {
    expect(memberIds.length).toBeGreaterThan(0)
  })

  it.each(memberIds)('%s has all required fields', (id) => {
    const member = FAMILY_MEMBERS[id]
    expect(member.id).toBe(id)
    expect(member.name).toBeTruthy()
    expect(member.name_en).toBeTruthy()
    expect(member.emoji).toBeTruthy()
    expect(member.avatar_emoji).toBeTruthy()
    expect(member.initials).toBeTruthy()
    expect(member.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect(member.colorEnd).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })
})

describe('NAV_ITEMS', () => {
  it('has unique paths', () => {
    const paths = NAV_ITEMS.map((item) => item.path)
    const uniquePaths = new Set(paths)
    expect(uniquePaths.size).toBe(paths.length)
  })

  it('all items have path, label, and icon', () => {
    for (const item of NAV_ITEMS) {
      expect(item.path).toBeTruthy()
      expect(item.label).toBeTruthy()
      expect(item.icon).toBeTruthy()
    }
  })
})
