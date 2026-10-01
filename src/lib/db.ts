import Dexie, { type EntityTable } from 'dexie'
import type {
  Task,
  Expense,
  BudgetSettings,
  ItineraryDay,
  PackingItem,
  BlogPost,
  Photo,
  Document,
  PlaylistItem,
  LocationNote,
  ActivityPoll,
} from './types'

/**
 * A photo whose file could not reach Supabase Storage yet. The compressed
 * image stays here (not as a base64 row) until an upload succeeds, so the
 * family never gets a photos row pointing at a file that only one phone has.
 */
export interface PendingPhotoUpload {
  id: string
  blob: Blob
  file_name: string
  photo: Omit<Photo, 'id' | 'created_at'>
  created_at: string
  attempts: number
  last_error?: string
}

interface SyncMeta {
  id: string
  table: string
  recordId: string
  action: 'upsert' | 'delete'
  timestamp: string
  synced: 0 | 1
}

class HeyUSADatabase extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  expenses!: EntityTable<Expense, 'id'>
  budgetSettings!: EntityTable<BudgetSettings & { id: string }, 'id'>
  itineraryDays!: EntityTable<ItineraryDay, 'id'>
  packingItems!: EntityTable<PackingItem, 'id'>
  blogPosts!: EntityTable<BlogPost, 'id'>
  photos!: EntityTable<Photo, 'id'>
  documents!: EntityTable<Document, 'id'>
  playlistItems!: EntityTable<PlaylistItem, 'id'>
  locationNotes!: EntityTable<LocationNote, 'id'>
  syncQueue!: EntityTable<SyncMeta, 'id'>
  polls!: EntityTable<ActivityPoll, 'id'>
  pendingPhotoUploads!: EntityTable<PendingPhotoUpload, 'id'>

  constructor() {
    super('hey-usa')
    this.version(1).stores({
      // *assigned_to indexes the array elements (multi-entry index)
      tasks: 'id, status, priority, group, *assigned_to',
      expenses: 'id, category, date, paid_by',
      budgetSettings: 'id',
      itineraryDays: 'id, date',
      // assigned_to is a scalar FamilyMemberId; is_packed is the boolean field
      packingItems: 'id, category, assigned_to, is_packed',
      blogPosts: 'id, created_at',
      // day_id is optional on Photo; taken_by replaces member_id
      photos: 'id, day_id, taken_by',
      documents: 'id, category',
      playlistItems: 'id',
      // locationId is camelCase in LocationNote
      locationNotes: 'id, locationId',
      syncQueue: 'id, table, synced, timestamp',
    })
    this.version(2).stores({
      // *assigned_to indexes the array elements (multi-entry index)
      tasks: 'id, status, priority, group, *assigned_to',
      expenses: 'id, category, date, paid_by',
      budgetSettings: 'id',
      itineraryDays: 'id, date',
      // assigned_to is a scalar FamilyMemberId; is_packed is the boolean field
      packingItems: 'id, category, assigned_to, is_packed',
      blogPosts: 'id, created_at',
      // day_id is optional on Photo; taken_by replaces member_id
      photos: 'id, day_id, taken_by',
      documents: 'id, category',
      playlistItems: 'id',
      // locationId is camelCase in LocationNote
      locationNotes: 'id, locationId',
      syncQueue: 'id, table, synced, timestamp',
      polls: 'id, day_id, created_by',
    })
    // Additive: only adds the photo upload queue, every other table is unchanged
    this.version(3).stores({
      pendingPhotoUploads: 'id, created_at',
    })
  }
}

export const localDb = new HeyUSADatabase()
