CREATE TABLE IF NOT EXISTS activity_polls (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  day_id TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  votes JSONB NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE activity_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON activity_polls FOR ALL USING (true) WITH CHECK (true);
