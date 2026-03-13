-- Hey USA — Full persistence schema
-- All tables use RLS disabled (PIN-based app, shared family data)

-- ─── Chat Messages ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  has_action BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Chat Memory (rolling summaries) ────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_memory (
  id TEXT PRIMARY KEY DEFAULT 'current',
  summary TEXT NOT NULL DEFAULT '',
  message_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default row
INSERT INTO chat_memory (id, summary, message_count) VALUES ('current', '', 0)
ON CONFLICT (id) DO NOTHING;

-- ─── Budget Settings ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budget_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  total_budget NUMERIC NOT NULL DEFAULT 50000,
  currency TEXT NOT NULL DEFAULT '₪',
  daily_budget NUMERIC DEFAULT 2500,
  alert_threshold NUMERIC NOT NULL DEFAULT 0.9,
  category_budgets JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Expenses ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT '₪',
  category TEXT NOT NULL DEFAULT 'other',
  paid_by TEXT NOT NULL DEFAULT 'aba',
  date TEXT NOT NULL,
  notes TEXT,
  receipt_photo_id TEXT,
  day_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Itinerary Days ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itinerary_days (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  city TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0
);

-- ─── Itinerary Stops ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itinerary_stops (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  lat NUMERIC,
  lng NUMERIC,
  start_time TEXT,
  end_time TEXT,
  category TEXT,
  cost_estimate NUMERIC,
  notes TEXT,
  booking_url TEXT,
  booking_confirmation TEXT,
  sort_order INTEGER DEFAULT 0
);

-- ─── Tasks ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'waiting')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  task_group TEXT NOT NULL DEFAULT 'pre_trip',
  assigned_to TEXT[] DEFAULT '{}',
  due_date TEXT,
  tags TEXT[] DEFAULT '{}',
  parent_id TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ─── Packing Items ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS packing_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  assigned_to TEXT NOT NULL DEFAULT 'aba',
  is_packed BOOLEAN DEFAULT FALSE,
  quantity INTEGER DEFAULT 1,
  notes TEXT
);

-- ─── Blog Posts ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  author_id TEXT NOT NULL DEFAULT 'aba',
  day_id TEXT,
  cover_photo_id TEXT,
  photo_ids TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Photos ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  taken_at TIMESTAMPTZ,
  taken_by TEXT,
  location TEXT,
  lat NUMERIC,
  lng NUMERIC,
  day_id TEXT,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Documents ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  family_member_id TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  notes TEXT,
  expiry_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Playlist Items ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS playlist_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT,
  url TEXT,
  added_by TEXT NOT NULL DEFAULT 'aba',
  votes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Moti Change Log ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS moti_changelog (
  id TEXT PRIMARY KEY,
  action JSONB NOT NULL,
  description TEXT NOT NULL,
  previous_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_itinerary_stops_day ON itinerary_stops(day_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_packing_assigned ON packing_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_photos_day ON photos(day_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);

-- ─── Disable RLS (shared family app, no user accounts) ─────────────
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE moti_changelog ENABLE ROW LEVEL SECURITY;

-- Allow anon access to all tables (PIN-based app)
CREATE POLICY "Allow all access" ON chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON chat_memory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON budget_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON itinerary_days FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON itinerary_stops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON packing_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON blog_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON photos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON playlist_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON moti_changelog FOR ALL USING (true) WITH CHECK (true);
