-- Member avatars (photos + custom names)
CREATE TABLE IF NOT EXISTS member_avatars (
  member_id TEXT PRIMARY KEY,
  photo_data TEXT,
  custom_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE member_avatars ENABLE ROW LEVEL SECURITY;

-- Allow all operations (same pattern as other tables)
CREATE POLICY "Allow all on member_avatars" ON member_avatars
  FOR ALL USING (true) WITH CHECK (true);
