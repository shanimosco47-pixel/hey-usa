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
  }
}

export const localDb = new HeyUSADatabase()
