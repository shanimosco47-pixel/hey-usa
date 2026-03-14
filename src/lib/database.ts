// ─── Supabase Database Layer ─────────────────────────────────────────
// CRUD operations for all app data + seeding from sample data

import { supabase } from './supabase'
import type {
  Task,
  Expense,
  BudgetSettings,
  ItineraryDay,
  ItineraryStop,
  PackingItem,
  BlogPost,
  Photo,
  Document,
  PlaylistItem,
  LocationNote,
} from './types'

// ─── Helpers ────────────────────────────────────────────────────────

function assertSupabase() {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase
}

// ─── Budget Settings ────────────────────────────────────────────────

export async function fetchBudgetSettings(): Promise<BudgetSettings | null> {
  const sb = assertSupabase()
  const { data, error } = await sb
    .from('budget_settings')
    .select('*')
    .eq('id', 'main')
    .single()
  if (error || !data) return null
  return {
    total_budget: Number(data.total_budget),
    currency: data.currency,
    daily_budget: data.daily_budget ? Number(data.daily_budget) : undefined,
    alert_threshold: Number(data.alert_threshold),
    category_budgets: data.category_budgets as Record<string, number>,
  }
}

export async function upsertBudgetSettings(settings: BudgetSettings): Promise<void> {
  const sb = assertSupabase()
  await sb.from('budget_settings').upsert({
    id: 'main',
    total_budget: settings.total_budget,
    currency: settings.currency,
    daily_budget: settings.daily_budget,
    alert_threshold: settings.alert_threshold,
    category_budgets: settings.category_budgets,
    updated_at: new Date().toISOString(),
  })
}

// ─── Expenses ───────────────────────────────────────────────────────

export async function fetchExpenses(): Promise<Expense[]> {
  const sb = assertSupabase()
  const { data, error } = await sb
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map((e) => ({
    id: e.id,
    title: e.title,
    amount: Number(e.amount),
    currency: e.currency,
    category: e.category,
    paid_by: e.paid_by,
    date: e.date,
    notes: e.notes || undefined,
    receipt_photo_id: e.receipt_photo_id || undefined,
    day_id: e.day_id || undefined,
    created_at: e.created_at,
  }))
}

export async function insertExpense(expense: Expense): Promise<void> {
  const sb = assertSupabase()
  await sb.from('expenses').insert({
    id: expense.id,
    title: expense.title,
    amount: expense.amount,
    currency: expense.currency,
    category: expense.category,
    paid_by: expense.paid_by,
    date: expense.date,
    notes: expense.notes || null,
    receipt_photo_id: expense.receipt_photo_id || null,
    day_id: expense.day_id || null,
    created_at: expense.created_at,
  })
}

export async function deleteExpenseById(id: string): Promise<void> {
  const sb = assertSupabase()
  await sb.from('expenses').delete().eq('id', id)
}

// ─── Itinerary ──────────────────────────────────────────────────────

export async function fetchItinerary(): Promise<ItineraryDay[]> {
  const sb = assertSupabase()
  const { data: days, error } = await sb
    .from('itinerary_days')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error || !days) return []

  const { data: stops } = await sb
    .from('itinerary_stops')
    .select('*')
    .order('sort_order', { ascending: true })

  const stopsMap = new Map<string, ItineraryStop[]>()
  for (const s of stops || []) {
    const list = stopsMap.get(s.day_id) || []
    list.push({
      id: s.id,
      title: s.title,
      description: s.description || undefined,
      location: s.location || undefined,
      lat: s.lat ? Number(s.lat) : undefined,
      lng: s.lng ? Number(s.lng) : undefined,
      start_time: s.start_time || undefined,
      end_time: s.end_time || undefined,
      category: s.category || undefined,
      cost_estimate: s.cost_estimate ? Number(s.cost_estimate) : undefined,
      notes: s.notes || undefined,
      booking_url: s.booking_url || undefined,
      booking_confirmation: s.booking_confirmation || undefined,
      order: s.sort_order || 0,
    })
    stopsMap.set(s.day_id, list)
  }

  return days.map((d) => ({
    id: d.id,
    date: d.date,
    title: d.title,
    description: d.description || undefined,
    city: d.city || undefined,
    notes: d.notes || undefined,
    stops: stopsMap.get(d.id) || [],
  }))
}

export async function updateItineraryDay(
  dayId: string,
  updates: Partial<Pick<ItineraryDay, 'notes' | 'title' | 'description'>>,
): Promise<void> {
  const sb = assertSupabase()
  await sb.from('itinerary_days').update(updates).eq('id', dayId)
}

export async function insertItineraryStop(
  dayId: string,
  stop: Omit<ItineraryStop, 'order'> & { order?: number },
): Promise<void> {
  const sb = assertSupabase()
  await sb.from('itinerary_stops').insert({
    id: stop.id,
    day_id: dayId,
    title: stop.title,
    description: stop.description || null,
    location: stop.location || null,
    lat: stop.lat || null,
    lng: stop.lng || null,
    start_time: stop.start_time || null,
    end_time: stop.end_time || null,
    category: stop.category || null,
    cost_estimate: stop.cost_estimate || null,
    notes: stop.notes || null,
    booking_url: stop.booking_url || null,
    booking_confirmation: stop.booking_confirmation || null,
    sort_order: stop.order || 0,
  })
}

// ─── Tasks ──────────────────────────────────────────────────────────

export async function fetchTasks(): Promise<Task[]> {
  const sb = assertSupabase()
  const { data, error } = await sb
    .from('tasks')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error || !data) return []
  return data.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description || undefined,
    status: t.status,
    priority: t.priority,
    group: t.task_group,
    assigned_to: t.assigned_to || [],
    due_date: t.due_date || undefined,
    created_at: t.created_at,
    updated_at: t.updated_at,
    completed_at: t.completed_at || undefined,
    tags: t.tags || [],
    parent_id: t.parent_id || undefined,
    order: t.sort_order || 0,
  }))
}

export async function upsertTask(task: Task): Promise<void> {
  const sb = assertSupabase()
  await sb.from('tasks').upsert({
    id: task.id,
    title: task.title,
    description: task.description || null,
    status: task.status,
    priority: task.priority,
    task_group: task.group,
    assigned_to: task.assigned_to,
    due_date: task.due_date || null,
    tags: task.tags || [],
    parent_id: task.parent_id || null,
    sort_order: task.order,
    created_at: task.created_at,
    updated_at: new Date().toISOString(),
    completed_at: task.completed_at || null,
  })
}

export async function deleteTaskById(id: string): Promise<void> {
  const sb = assertSupabase()
  await sb.from('tasks').delete().eq('id', id)
}

// ─── Packing Items ──────────────────────────────────────────────────

export async function fetchPackingItems(): Promise<PackingItem[]> {
  const sb = assertSupabase()
  const { data, error } = await sb.from('packing_items').select('*')
  if (error || !data) return []
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    assigned_to: p.assigned_to,
    is_packed: p.is_packed,
    quantity: p.quantity,
    notes: p.notes || undefined,
  }))
}

export async function upsertPackingItem(item: PackingItem): Promise<void> {
  const sb = assertSupabase()
  await sb.from('packing_items').upsert({
    id: item.id,
    name: item.name,
    category: item.category,
    assigned_to: item.assigned_to,
    is_packed: item.is_packed,
    quantity: item.quantity,
    notes: item.notes || null,
  })
}

export async function deletePackingItemById(id: string): Promise<void> {
  const sb = assertSupabase()
  await sb.from('packing_items').delete().eq('id', id)
}

// ─── Blog Posts ─────────────────────────────────────────────────────

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const sb = assertSupabase()
  const { data, error } = await sb
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map((b) => ({
    id: b.id,
    title: b.title,
    content: b.content,
    author_id: b.author_id,
    day_id: b.day_id || undefined,
    cover_photo_id: b.cover_photo_id || undefined,
    photo_ids: b.photo_ids || [],
    tags: b.tags || [],
    is_published: b.is_published,
    created_at: b.created_at,
    updated_at: b.updated_at,
  }))
}

export async function upsertBlogPost(post: BlogPost): Promise<void> {
  const sb = assertSupabase()
  await sb.from('blog_posts').upsert({
    id: post.id,
    title: post.title,
    content: post.content,
    author_id: post.author_id,
    day_id: post.day_id || null,
    cover_photo_id: post.cover_photo_id || null,
    photo_ids: post.photo_ids || [],
    tags: post.tags || [],
    is_published: post.is_published,
    created_at: post.created_at,
    updated_at: new Date().toISOString(),
  })
}

export async function deleteBlogPostById(id: string): Promise<void> {
  const sb = assertSupabase()
  await sb.from('blog_posts').delete().eq('id', id)
}

// ─── Photos ─────────────────────────────────────────────────────────

export async function fetchPhotos(): Promise<Photo[]> {
  const sb = assertSupabase()
  const { data, error } = await sb
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map((p) => ({
    id: p.id,
    url: p.url,
    thumbnail_url: p.thumbnail_url || undefined,
    caption: p.caption || undefined,
    taken_at: p.taken_at || undefined,
    taken_by: p.taken_by || undefined,
    location: p.location || undefined,
    lat: p.lat ? Number(p.lat) : undefined,
    lng: p.lng ? Number(p.lng) : undefined,
    day_id: p.day_id || undefined,
    tags: p.tags || [],
    is_favorite: p.is_favorite,
    created_at: p.created_at,
  }))
}

export async function upsertPhoto(photo: Photo): Promise<void> {
  const sb = assertSupabase()
  await sb.from('photos').upsert({
    id: photo.id,
    url: photo.url,
    thumbnail_url: photo.thumbnail_url || null,
    caption: photo.caption || null,
    taken_at: photo.taken_at || null,
    taken_by: photo.taken_by || null,
    location: photo.location || null,
    lat: photo.lat || null,
    lng: photo.lng || null,
    day_id: photo.day_id || null,
    tags: photo.tags || [],
    is_favorite: photo.is_favorite,
    created_at: photo.created_at,
  })
}

export async function deletePhotoById(id: string): Promise<void> {
  const sb = assertSupabase()
  await sb.from('photos').delete().eq('id', id)
}

// ─── Documents ──────────────────────────────────────────────────────

export async function fetchDocuments(): Promise<Document[]> {
  const sb = assertSupabase()
  const { data, error } = await sb
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map((d) => ({
    id: d.id,
    title: d.title,
    category: d.category,
    family_member_id: d.family_member_id || undefined,
    file_url: d.file_url || undefined,
    thumbnail_url: d.thumbnail_url || undefined,
    file_type: d.file_type || undefined,
    file_size: d.file_size || undefined,
    notes: d.notes || undefined,
    expiry_date: d.expiry_date || undefined,
    created_at: d.created_at,
    updated_at: d.updated_at,
  }))
}

export async function upsertDocument(doc: Document): Promise<void> {
  const sb = assertSupabase()
  await sb.from('documents').upsert({
    id: doc.id,
    title: doc.title,
    category: doc.category,
    family_member_id: doc.family_member_id || null,
    file_url: doc.file_url || null,
    thumbnail_url: doc.thumbnail_url || null,
    file_type: doc.file_type || null,
    file_size: doc.file_size || null,
    notes: doc.notes || null,
    expiry_date: doc.expiry_date || null,
    created_at: doc.created_at,
    updated_at: new Date().toISOString(),
  })
}

export async function deleteDocumentById(id: string): Promise<void> {
  const sb = assertSupabase()
  await sb.from('documents').delete().eq('id', id)
}

// ─── Playlist Items ─────────────────────────────────────────────────

export async function fetchPlaylistItems(): Promise<PlaylistItem[]> {
  const sb = assertSupabase()
  const { data, error } = await sb
    .from('playlist_items')
    .select('*')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map((p) => ({
    id: p.id,
    title: p.title,
    artist: p.artist || undefined,
    url: p.url || undefined,
    added_by: p.added_by,
    votes: (p.votes as PlaylistItem['votes']) || [],
    created_at: p.created_at,
  }))
}

export async function upsertPlaylistItem(item: PlaylistItem): Promise<void> {
  const sb = assertSupabase()
  await sb.from('playlist_items').upsert({
    id: item.id,
    title: item.title,
    artist: item.artist || null,
    url: item.url || null,
    added_by: item.added_by,
    votes: item.votes,
    created_at: item.created_at,
  })
}

export async function deletePlaylistItem(id: string): Promise<void> {
  const sb = assertSupabase()
  await sb.from('playlist_items').delete().eq('id', id)
}

// ─── Location Notes ─────────────────────────────────────────────────

export async function fetchLocationNotes(): Promise<LocationNote[]> {
  const sb = assertSupabase()
  const { data, error } = await sb
    .from('location_notes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map((n) => ({
    id: n.id,
    locationId: n.location_id,
    text: n.text,
    author: n.author,
    color: n.color,
    pinned: n.pinned,
    created_at: n.created_at,
    updated_at: n.updated_at,
  }))
}

export async function upsertLocationNote(note: LocationNote): Promise<void> {
  const sb = assertSupabase()
  await sb.from('location_notes').upsert({
    id: note.id,
    location_id: note.locationId,
    text: note.text,
    author: note.author,
    color: note.color,
    pinned: note.pinned,
    created_at: note.created_at,
    updated_at: new Date().toISOString(),
  })
}

export async function deleteLocationNoteById(id: string): Promise<void> {
  const sb = assertSupabase()
  await sb.from('location_notes').delete().eq('id', id)
}

// ─── Member Avatars ─────────────────────────────────────────────────

export interface MemberAvatarRow {
  member_id: string
  photo_data: string | null
  custom_name: string | null
}

export async function fetchMemberAvatars(): Promise<MemberAvatarRow[]> {
  const sb = assertSupabase()
  const { data, error } = await sb.from('member_avatars').select('*')
  if (error || !data) return []
  return data
}

export async function upsertMemberAvatar(row: MemberAvatarRow): Promise<void> {
  const sb = assertSupabase()
  await sb.from('member_avatars').upsert({
    member_id: row.member_id,
    photo_data: row.photo_data,
    custom_name: row.custom_name,
    updated_at: new Date().toISOString(),
  })
}

// ─── Chat Messages ──────────────────────────────────────────────────

export interface ChatMessageRow {
  id: string
  role: 'user' | 'assistant'
  content: string
  has_action: boolean
  created_at: string
}

export async function fetchChatMessages(limit = 50): Promise<ChatMessageRow[]> {
  const sb = assertSupabase()
  const { data, error } = await sb
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error || !data) return []
  return data
}

export async function insertChatMessage(msg: ChatMessageRow): Promise<void> {
  const sb = assertSupabase()
  await sb.from('chat_messages').insert(msg)
}

export async function fetchRecentChatMessages(limit = 15): Promise<ChatMessageRow[]> {
  const sb = assertSupabase()
  // Get last N messages ordered newest first, then reverse for chronological
  const { data, error } = await sb
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data.reverse()
}

// ─── Chat Memory (rolling summary) ─────────────────────────────────

export async function fetchChatMemory(): Promise<{ summary: string; message_count: number }> {
  const sb = assertSupabase()
  const { data, error } = await sb
    .from('chat_memory')
    .select('*')
    .eq('id', 'current')
    .single()
  if (error || !data) return { summary: '', message_count: 0 }
  return { summary: data.summary, message_count: data.message_count }
}

export async function updateChatMemory(summary: string, messageCount: number): Promise<void> {
  const sb = assertSupabase()
  await sb.from('chat_memory').upsert({
    id: 'current',
    summary,
    message_count: messageCount,
    updated_at: new Date().toISOString(),
  })
}

// ─── Moti Change Log ────────────────────────────────────────────────

export async function fetchMotiChangeLog(): Promise<Array<{
  id: string
  action: unknown
  description: string
  previous_value: unknown
  new_value: unknown
  created_at: string
}>> {
  const sb = assertSupabase()
  const { data, error } = await sb
    .from('moti_changelog')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error || !data) return []
  return data
}

export async function insertMotiChangeLogEntry(entry: {
  id: string
  action: unknown
  description: string
  previous_value: unknown
  new_value: unknown
}): Promise<void> {
  const sb = assertSupabase()
  await sb.from('moti_changelog').insert({
    ...entry,
    created_at: new Date().toISOString(),
  })
}

export async function deleteMotiChangeLog(): Promise<void> {
  const sb = assertSupabase()
  await sb.from('moti_changelog').delete().gte('id', '')
}

// ─── Seeding ────────────────────────────────────────────────────────

export async function isSeeded(): Promise<boolean> {
  const sb = assertSupabase()
  const { count } = await sb
    .from('budget_settings')
    .select('*', { count: 'exact', head: true })
  return (count || 0) > 0
}

export async function seedAllData(): Promise<void> {
  const sb = assertSupabase()

  // Dynamic imports to avoid bundling seed data when not needed
  const { SAMPLE_BUDGET_SETTINGS, SAMPLE_EXPENSES } = await import(
    '@/modules/budget/data/sampleExpenses'
  )
  const { ITINERARY_DAYS } = await import('@/data/itinerary')
  const { sampleTasks: SAMPLE_TASKS } = await import('@/modules/tasks/data/sampleTasks')
  const { SAMPLE_PACKING_ITEMS } = await import('@/modules/packing/data/samplePacking')
  const { SAMPLE_BLOG_POSTS } = await import('@/modules/blog/data/samplePosts')
  const { SAMPLE_PHOTOS } = await import('@/modules/photos/data/samplePhotos')
  const { sampleDocuments: SAMPLE_DOCUMENTS } = await import('@/modules/documents/data/sampleDocuments')
  const { SAMPLE_PLAYLIST } = await import(
    '@/modules/entertainment/data/sampleEntertainment'
  )
  const { SAMPLE_LOCATION_NOTES } = await import('@/data/sampleLocationNotes')

  // Budget settings
  await sb.from('budget_settings').upsert({
    id: 'main',
    total_budget: SAMPLE_BUDGET_SETTINGS.total_budget,
    currency: SAMPLE_BUDGET_SETTINGS.currency,
    daily_budget: SAMPLE_BUDGET_SETTINGS.daily_budget,
    alert_threshold: SAMPLE_BUDGET_SETTINGS.alert_threshold,
    category_budgets: SAMPLE_BUDGET_SETTINGS.category_budgets,
  })

  // Expenses
  if (SAMPLE_EXPENSES.length > 0) {
    await sb.from('expenses').upsert(
      SAMPLE_EXPENSES.map((e: Expense) => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
        currency: e.currency,
        category: e.category,
        paid_by: e.paid_by,
        date: e.date,
        notes: e.notes || null,
        created_at: e.created_at,
      })),
    )
  }

  // Itinerary days + stops
  if (ITINERARY_DAYS.length > 0) {
    await sb.from('itinerary_days').upsert(
      ITINERARY_DAYS.map((d: ItineraryDay, i: number) => ({
        id: d.id,
        date: d.date,
        title: d.title,
        description: d.description || null,
        city: d.city || null,
        notes: d.notes || null,
        sort_order: i,
      })),
    )

    const allStops: Array<Record<string, unknown>> = []
    for (const day of ITINERARY_DAYS) {
      for (const stop of (day as ItineraryDay).stops) {
        allStops.push({
          id: stop.id,
          day_id: day.id,
          title: stop.title,
          description: stop.description || null,
          location: stop.location || null,
          lat: stop.lat || null,
          lng: stop.lng || null,
          start_time: stop.start_time || null,
          end_time: stop.end_time || null,
          category: stop.category || null,
          cost_estimate: stop.cost_estimate || null,
          notes: stop.notes || null,
          booking_url: stop.booking_url || null,
          booking_confirmation: stop.booking_confirmation || null,
          sort_order: stop.order,
        })
      }
    }
    // Insert in batches of 50 to avoid payload limits
    for (let i = 0; i < allStops.length; i += 50) {
      await sb.from('itinerary_stops').upsert(allStops.slice(i, i + 50))
    }
  }

  // Tasks
  if (SAMPLE_TASKS.length > 0) {
    await sb.from('tasks').upsert(
      SAMPLE_TASKS.map((t: Task) => ({
        id: t.id,
        title: t.title,
        description: t.description || null,
        status: t.status,
        priority: t.priority,
        task_group: t.group,
        assigned_to: t.assigned_to,
        due_date: t.due_date || null,
        tags: t.tags || [],
        parent_id: t.parent_id || null,
        sort_order: t.order,
        created_at: t.created_at,
        updated_at: t.updated_at,
        completed_at: t.completed_at || null,
      })),
    )
  }

  // Packing items
  if (SAMPLE_PACKING_ITEMS.length > 0) {
    await sb.from('packing_items').upsert(
      SAMPLE_PACKING_ITEMS.map((p: PackingItem) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        assigned_to: p.assigned_to,
        is_packed: p.is_packed,
        quantity: p.quantity,
        notes: p.notes || null,
      })),
    )
  }

  // Blog posts
  if (SAMPLE_BLOG_POSTS.length > 0) {
    await sb.from('blog_posts').upsert(
      SAMPLE_BLOG_POSTS.map((b: BlogPost) => ({
        id: b.id,
        title: b.title,
        content: b.content,
        author_id: b.author_id,
        day_id: b.day_id || null,
        cover_photo_id: b.cover_photo_id || null,
        photo_ids: b.photo_ids || [],
        tags: b.tags || [],
        is_published: b.is_published,
        created_at: b.created_at,
        updated_at: b.updated_at,
      })),
    )
  }

  // Photos
  if (SAMPLE_PHOTOS.length > 0) {
    await sb.from('photos').upsert(
      SAMPLE_PHOTOS.map((p: Photo) => ({
        id: p.id,
        url: p.url,
        thumbnail_url: p.thumbnail_url || null,
        caption: p.caption || null,
        taken_at: p.taken_at || null,
        taken_by: p.taken_by || null,
        location: p.location || null,
        lat: p.lat || null,
        lng: p.lng || null,
        day_id: p.day_id || null,
        tags: p.tags || [],
        is_favorite: p.is_favorite,
        created_at: p.created_at,
      })),
    )
  }

  // Documents
  if (SAMPLE_DOCUMENTS.length > 0) {
    await sb.from('documents').upsert(
      SAMPLE_DOCUMENTS.map((d: Document) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        family_member_id: d.family_member_id || null,
        file_url: d.file_url || null,
        thumbnail_url: d.thumbnail_url || null,
        file_type: d.file_type || null,
        file_size: d.file_size || null,
        notes: d.notes || null,
        expiry_date: d.expiry_date || null,
        created_at: d.created_at,
        updated_at: d.updated_at,
      })),
    )
  }

  // Playlist
  if (SAMPLE_PLAYLIST.length > 0) {
    await sb.from('playlist_items').upsert(
      SAMPLE_PLAYLIST.map((p: PlaylistItem) => ({
        id: p.id,
        title: p.title,
        artist: p.artist || null,
        url: p.url || null,
        added_by: p.added_by,
        votes: p.votes,
        created_at: p.created_at,
      })),
    )
  }

  // Location notes
  if (SAMPLE_LOCATION_NOTES.length > 0) {
    await sb.from('location_notes').upsert(
      SAMPLE_LOCATION_NOTES.map((n: LocationNote) => ({
        id: n.id,
        location_id: n.locationId,
        text: n.text,
        author: n.author,
        color: n.color,
        pinned: n.pinned,
        created_at: n.created_at,
        updated_at: n.updated_at,
      })),
    )
  }

  console.log('[Hey USA] Seed data loaded into Supabase')
}
