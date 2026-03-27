import type { FamilyMemberId } from './types'

export type FamilyRole = 'parent' | 'child' | 'ai'

const PARENTS: FamilyMemberId[] = ['aba', 'ima']
const CHILDREN: FamilyMemberId[] = ['kid1', 'kid2', 'kid3']

export function getFamilyRole(memberId: FamilyMemberId): FamilyRole {
  if (PARENTS.includes(memberId)) return 'parent'
  if (CHILDREN.includes(memberId)) return 'child'
  return 'ai'
}

export function isParent(memberId: FamilyMemberId): boolean {
  return PARENTS.includes(memberId)
}

export function isChild(memberId: FamilyMemberId): boolean {
  return CHILDREN.includes(memberId)
}
