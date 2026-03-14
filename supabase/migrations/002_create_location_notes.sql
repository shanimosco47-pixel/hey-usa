-- Location Notes (sticky notes per location)
CREATE TABLE IF NOT EXISTS location_notes (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'yellow',
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by location
CREATE INDEX IF NOT EXISTS idx_location_notes_location_id ON location_notes(location_id);

-- Enable RLS
ALTER TABLE location_notes ENABLE ROW LEVEL SECURITY;

-- Allow all operations (same pattern as other tables)
CREATE POLICY "Allow all on location_notes" ON location_notes
  FOR ALL USING (true) WITH CHECK (true);
