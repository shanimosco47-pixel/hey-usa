// ─── Core Enums / Unions ────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'waiting';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskGroup = 'pre_trip' | 'during_trip' | 'post_trip';

export type FamilyMemberId = 'aba' | 'ima' | 'kid1' | 'kid2' | 'kid3' | 'moti';

// ─── Tasks ──────────────────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  group: TaskGroup;
  assigned_to: FamilyMemberId[];
  due_date?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  tags?: string[];
  parent_id?: string;
  order: number;
}

// ─── Family ─────────────────────────────────────────────────────────

export interface FamilyMember {
  id: FamilyMemberId;
  name: string;
  name_en: string;
  avatar_emoji: string;
  color: string;
}

// ─── Itinerary ──────────────────────────────────────────────────────

export interface ItineraryStop {
  id: string;
  title: string;
  description?: string;
  location?: string;
  lat?: number;
  lng?: number;
  start_time?: string;
  end_time?: string;
  category?: string;
  cost_estimate?: number;
  notes?: string;
  booking_url?: string;
  booking_confirmation?: string;
  order: number;
}

export interface ItineraryDay {
  id: string;
  date: string;
  title: string;
  description?: string;
  city?: string;
  stops: ItineraryStop[];
  notes?: string;
}

// ─── Documents ──────────────────────────────────────────────────────

export interface Document {
  id: string;
  title: string;
  category: string;
  family_member_id?: FamilyMemberId;
  file_url?: string;
  thumbnail_url?: string;
  file_type?: string;
  file_size?: number;
  notes?: string;
  expiry_date?: string;
  locationId?: string;
  created_at: string;
  updated_at: string;
}

// ─── Photos ─────────────────────────────────────────────────────────

export interface Photo {
  id: string;
  url: string;
  thumbnail_url?: string;
  caption?: string;
  taken_at?: string;
  taken_by?: FamilyMemberId;
  location?: string;
  lat?: number;
  lng?: number;
  day_id?: string;
  tags?: string[];
  is_favorite: boolean;
  created_at: string;
}

// ─── Blog ───────────────────────────────────────────────────────────

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  author_id: FamilyMemberId;
  day_id?: string;
  cover_photo_id?: string;
  photo_ids?: string[];
  tags?: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Budget & Expenses ──────────────────────────────────────────────

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  paid_by: FamilyMemberId;
  date: string;
  notes?: string;
  receipt_photo_id?: string;
  day_id?: string;
  created_at: string;
}

export interface BudgetSettings {
  total_budget: number;
  currency: string;
  category_budgets: Record<string, number>;
  daily_budget?: number;
  alert_threshold: number;
}

// ─── Packing ────────────────────────────────────────────────────────

export interface PackingItem {
  id: string;
  name: string;
  category: string;
  assigned_to: FamilyMemberId;
  is_packed: boolean;
  quantity: number;
  notes?: string;
}

// ─── Playlist ───────────────────────────────────────────────────────

export interface PlaylistItem {
  id: string;
  title: string;
  artist?: string;
  url?: string;
  added_by: FamilyMemberId;
  votes: PlaylistVote[];
  created_at: string;
}

export interface PlaylistVote {
  member_id: FamilyMemberId;
  vote: 'up' | 'down';
}

// ─── Location Notes ────────────────────────────────────────────

export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'purple'

export interface LocationNote {
  id: string;
  locationId: string | null;
  text: string;
  author: FamilyMemberId;
  color: NoteColor;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Sync ───────────────────────────────────────────────────────────

export interface SyncQueueItem {
  id: string;
  table: string;
  record_id: string;
  action: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  created_at: string;
  retries: number;
  last_error?: string;
}
