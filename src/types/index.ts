// Re-export core types from the canonical location
export type {
  FamilyMemberId,
  FamilyMember,
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
  AccommodationType,
  BookingStatus,
  BookingPriority,
  BookingChangeEntry,
  CampsiteBooking,
} from '@/lib/types'

/** Status badge configuration */
export interface StatusConfig {
  label: string
  color: string
  bg: string
}
