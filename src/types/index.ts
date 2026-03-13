// Re-export core types from the canonical location
export type {
  FamilyMemberId,
  TaskStatus,
  TaskPriority,
  TaskGroup,
  Task,
  ItineraryStop,
  ItineraryDay,
  Document,
  Photo,
  BlogPost,
  Expense,
  BudgetSettings,
  PackingItem,
  PlaylistItem,
  PlaylistVote,
  SyncQueueItem,
} from '@/lib/types'

// Re-export FamilyMember under an alias to avoid conflicts with local UI definition
export type { FamilyMember as FamilyMemberRecord } from '@/lib/types'

import type { FamilyMemberId } from '@/lib/types'

/** UI-oriented family member shape used by avatar and selection components */
export interface FamilyMember {
  id: FamilyMemberId
  name: string
  emoji: string
  initials: string
  color: string
  colorEnd?: string
}

/** Status badge configuration */
export interface StatusConfig {
  label: string
  color: string
  bg: string
}
