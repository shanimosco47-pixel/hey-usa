// ─── Dexie-Supabase Sync Engine ──────────────────────────────────────────────
// Bidirectional sync: write locally first, queue changes, flush when online.
// On load, pull from Supabase and merge into Dexie (last-write-wins).

import { localDb } from './db'
import { supabase } from './supabase'
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
  PollVote,
} from './types'

// ─── Table Name Mapping ──────────────────────────────────────────────────────

/** Maps Dexie table names to their Supabase equivalents */
const TABLE_MAP: Record<string, string> = {
  tasks: 'tasks',
  expenses: 'expenses',
  budgetSettings: 'budget_settings',
  itineraryDays: 'itinerary_days',
  packingItems: 'packing_items',
  blogPosts: 'blog_posts',
  photos: 'photos',
  documents: 'documents',
  playlistItems: 'playlist_items',
  locationNotes: 'location_notes',
  polls: 'activity_polls',
}

// ─── Queue ───────────────────────────────────────────────────────────────────

/**
 * Queue a mutation for sync. Called after every Dexie write.
 */
export async function queueSync(
  table: string,
  recordId: string,
  action: 'upsert' | 'delete',
): Promise<void> {
  await localDb.syncQueue.add({
    id: crypto.randomUUID(),
    table,
    recordId,
    action,
    timestamp: new Date().toISOString(),
    synced: 0,
  })
}

// ─── Flush ───────────────────────────────────────────────────────────────────

/**
 * Flush all pending sync items to Supabase.
 * Called when coming back online or periodically.
 * Returns the number of items successfully synced.
 */
export async function flushSyncQueue(): Promise<number> {
  if (!supabase) return 0

  const pending = await localDb.syncQueue.where('synced').equals(0).toArray()
  let synced = 0

  for (const item of pending) {
    const supabaseTable = TABLE_MAP[item.table]
    if (!supabaseTable) continue

    try {
      if (item.action === 'delete') {
        await supabase.from(supabaseTable).delete().eq('id', item.recordId)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dexieTable = localDb.table(item.table) as any
        const record = await dexieTable.get(item.recordId)
        if (record) {
          // Transform Dexie record back to Supabase shape before upserting
          const payload = toSupabaseShape(item.table, record)
          await supabase.from(supabaseTable).upsert(payload)
        }
      }
      await localDb.syncQueue.update(item.id, { synced: 1 })
      synced++
    } catch {
      // Will retry on next flush
      console.warn(`[sync] Flush failed for ${item.table}/${item.recordId}`)
    }
  }

  // Clean up synced items older than 1 hour
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()
  await localDb.syncQueue
    .where('synced')
    .equals(1)
    .filter((item) => item.timestamp < oneHourAgo)
    .delete()

  return synced
}

// ─── Shape transformers (Dexie → Supabase) ──────────────────────────────────

/**
 * Convert a Dexie record to its Supabase column shape.
 * Only the tables that have field-name differences need special treatment.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSupabaseShape(table: string, record: any): Record<string, unknown> {
  switch (table) {
    case 'tasks': {
      const t = record as Task
      return {
        id: t.id,
        title: t.title,
        description: t.description ?? null,
        status: t.status,
        priority: t.priority,
        task_group: t.group, // Dexie: group → Supabase: task_group
        assigned_to: t.assigned_to,
        due_date: t.due_date ?? null,
        tags: t.tags ?? [],
        parent_id: t.parent_id ?? null,
        sort_order: t.order, // Dexie: order → Supabase: sort_order
        created_at: t.created_at,
        updated_at: t.updated_at,
        completed_at: t.completed_at ?? null,
      }
    }
    case 'locationNotes': {
      const n = record as LocationNote
      return {
        id: n.id,
        location_id: n.locationId, // Dexie: locationId → Supabase: location_id
        text: n.text,
        author: n.author,
        color: n.color,
        pinned: n.pinned,
        created_at: n.created_at,
        updated_at: n.updated_at,
      }
    }
    case 'budgetSettings': {
      const b = record as BudgetSettings & { id: string }
      return {
        id: b.id,
        total_budget: b.total_budget,
        currency: b.currency,
        daily_budget: b.daily_budget ?? null,
        alert_threshold: b.alert_threshold,
        category_budgets: b.category_budgets,
        updated_at: new Date().toISOString(),
      }
    }
    default:
      // For tables with 1:1 column mapping, pass through as-is
      return record as Record<string, unknown>
  }
}

// ─── Pull ────────────────────────────────────────────────────────────────────

/**
 * Pull all data from Supabase into Dexie (initial load / refresh).
 * Uses bulkPut for efficiency — last-write-wins by overwriting local records.
 * Returns true on success, false if Supabase is unavailable or an error occurs.
 */
export async function pullFromSupabase(): Promise<boolean> {
  if (!supabase) return false

  try {
    const [
      { data: rawTasks },
      { data: rawExpenses },
      { data: rawBudget },
      { data: rawItineraryDays },
      { data: rawPackingItems },
      { data: rawBlogPosts },
      { data: rawPhotos },
      { data: rawDocuments },
      { data: rawPlaylistItems },
      { data: rawLocationNotes },
      { data: rawPolls },
    ] = await Promise.all([
      supabase.from('tasks').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('budget_settings').select('*').eq('id', 'main').single(),
      supabase.from('itinerary_days').select('*'),
      supabase.from('packing_items').select('*'),
      supabase.from('blog_posts').select('*'),
      supabase.from('photos').select('*'),
      supabase.from('documents').select('*'),
      supabase.from('playlist_items').select('*'),
      supabase.from('location_notes').select('*'),
      supabase.from('activity_polls').select('*'),
    ])

    // ── Transform Supabase shapes → Dexie/TypeScript types ─────────────────

    const tasks: Task[] = (rawTasks ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t: any): Task => ({
        id: t.id,
        title: t.title,
        description: t.description ?? undefined,
        status: t.status,
        priority: t.priority,
        group: t.task_group, // Supabase: task_group → Dexie: group
        assigned_to: t.assigned_to ?? [],
        due_date: t.due_date ?? undefined,
        created_at: t.created_at,
        updated_at: t.updated_at,
        completed_at: t.completed_at ?? undefined,
        tags: t.tags ?? [],
        parent_id: t.parent_id ?? undefined,
        order: t.sort_order ?? 0, // Supabase: sort_order → Dexie: order
      }),
    )

    const expenses: Expense[] = (rawExpenses ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any): Expense => ({
        id: e.id,
        title: e.title,
        amount: Number(e.amount), // Supabase may return numeric as string
        currency: e.currency,
        category: e.category,
        paid_by: e.paid_by,
        date: e.date,
        notes: e.notes ?? undefined,
        receipt_photo_id: e.receipt_photo_id ?? undefined,
        day_id: e.day_id ?? undefined,
        created_at: e.created_at,
      }),
    )

    // budget_settings returns a single row (or null)
    const budgetRecord: (BudgetSettings & { id: string }) | null = rawBudget
      ? {
          id: 'main',
          total_budget: Number(rawBudget.total_budget),
          currency: rawBudget.currency,
          daily_budget: rawBudget.daily_budget != null ? Number(rawBudget.daily_budget) : undefined,
          alert_threshold: Number(rawBudget.alert_threshold),
          category_budgets: (rawBudget.category_budgets as Record<string, number>) ?? {},
        }
      : null

    // itinerary_days — stored without stops in Dexie (stops are a joined table)
    const itineraryDays: ItineraryDay[] = (rawItineraryDays ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (d: any): ItineraryDay => ({
        id: d.id,
        date: d.date,
        title: d.title,
        description: d.description ?? undefined,
        city: d.city ?? undefined,
        notes: d.notes ?? undefined,
        stops: [], // stops are a separate table; omit from local cache
      }),
    )

    const packingItems: PackingItem[] = (rawPackingItems ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any): PackingItem => ({
        id: p.id,
        name: p.name,
        category: p.category,
        assigned_to: p.assigned_to,
        is_packed: p.is_packed,
        quantity: p.quantity,
        notes: p.notes ?? undefined,
      }),
    )

    const blogPosts: BlogPost[] = (rawBlogPosts ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (b: any): BlogPost => ({
        id: b.id,
        title: b.title,
        content: b.content,
        author_id: b.author_id,
        day_id: b.day_id ?? undefined,
        cover_photo_id: b.cover_photo_id ?? undefined,
        photo_ids: b.photo_ids ?? [],
        tags: b.tags ?? [],
        is_published: b.is_published,
        created_at: b.created_at,
        updated_at: b.updated_at,
      }),
    )

    const photos: Photo[] = (rawPhotos ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any): Photo => ({
        id: p.id,
        url: p.url,
        thumbnail_url: p.thumbnail_url ?? undefined,
        caption: p.caption ?? undefined,
        taken_at: p.taken_at ?? undefined,
        taken_by: p.taken_by ?? undefined,
        location: p.location ?? undefined,
        lat: p.lat != null ? Number(p.lat) : undefined, // Supabase numeric → JS number
        lng: p.lng != null ? Number(p.lng) : undefined,
        day_id: p.day_id ?? undefined,
        tags: p.tags ?? [],
        is_favorite: p.is_favorite,
        created_at: p.created_at,
      }),
    )

    const documents: Document[] = (rawDocuments ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (d: any): Document => ({
        id: d.id,
        title: d.title,
        category: d.category,
        family_member_id: d.family_member_id ?? undefined,
        file_url: d.file_url ?? undefined,
        thumbnail_url: d.thumbnail_url ?? undefined,
        file_type: d.file_type ?? undefined,
        file_size: d.file_size ?? undefined,
        notes: d.notes ?? undefined,
        expiry_date: d.expiry_date ?? undefined,
        created_at: d.created_at,
        updated_at: d.updated_at,
      }),
    )

    const playlistItems: PlaylistItem[] = (rawPlaylistItems ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any): PlaylistItem => ({
        id: p.id,
        title: p.title,
        artist: p.artist ?? undefined,
        url: p.url ?? undefined,
        added_by: p.added_by,
        votes: (p.votes as PlaylistItem['votes']) ?? [],
        created_at: p.created_at,
      }),
    )

    const locationNotes: LocationNote[] = (rawLocationNotes ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (n: any): LocationNote => ({
        id: n.id,
        locationId: n.location_id, // Supabase: location_id → Dexie: locationId
        text: n.text,
        author: n.author,
        color: n.color,
        pinned: n.pinned,
        created_at: n.created_at,
        updated_at: n.updated_at,
      }),
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const polls: ActivityPoll[] = (rawPolls ?? []).map((p: any): ActivityPoll => ({
      id: p.id,
      day_id: p.day_id,
      question: p.question,
      options: (p.options as string[]) ?? [],
      votes: (p.votes as PollVote[]) ?? [],
      created_by: p.created_by,
      created_at: p.created_at,
    }))

    // ── Write into Dexie in a single transaction ────────────────────────────
    await localDb.transaction(
      'rw',
      [
        localDb.tasks,
        localDb.expenses,
        localDb.budgetSettings,
        localDb.itineraryDays,
        localDb.packingItems,
        localDb.blogPosts,
        localDb.photos,
        localDb.documents,
        localDb.playlistItems,
        localDb.locationNotes,
        localDb.polls,
      ],
      async () => {
        if (tasks.length) await localDb.tasks.bulkPut(tasks)
        if (expenses.length) await localDb.expenses.bulkPut(expenses)
        if (budgetRecord) await localDb.budgetSettings.put(budgetRecord)
        if (itineraryDays.length) await localDb.itineraryDays.bulkPut(itineraryDays)
        if (packingItems.length) await localDb.packingItems.bulkPut(packingItems)
        if (blogPosts.length) await localDb.blogPosts.bulkPut(blogPosts)
        if (photos.length) await localDb.photos.bulkPut(photos)
        if (documents.length) await localDb.documents.bulkPut(documents)
        if (playlistItems.length) await localDb.playlistItems.bulkPut(playlistItems)
        if (locationNotes.length) await localDb.locationNotes.bulkPut(locationNotes)
        if (polls.length) await localDb.polls.bulkPut(polls)
      },
    )

    return true
  } catch (err) {
    console.error('[sync] Pull from Supabase failed:', err)
    return false
  }
}
