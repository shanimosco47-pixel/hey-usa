-- The live `documents` table gained location_id, status, visit_date, and booking_id
-- out-of-band; the repo migrations never added them. Code (fetchDocuments,
-- upsertDocument, and the Dexie→Supabase sync mapper) reads and writes these columns,
-- so a database created purely from these migrations would reject document syncs.
-- Add them idempotently — a no-op where they already exist.

ALTER TABLE documents ADD COLUMN IF NOT EXISTS location_id TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS visit_date TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS booking_id TEXT;

CREATE INDEX IF NOT EXISTS idx_documents_location ON documents (location_id);
CREATE INDEX IF NOT EXISTS idx_documents_booking ON documents (booking_id);
