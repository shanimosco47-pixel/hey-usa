-- Add document_id column to link campsite bookings to their source document
ALTER TABLE campsite_bookings
  ADD COLUMN IF NOT EXISTS document_id TEXT REFERENCES documents(id);

-- Index for reverse lookups (document -> booking)
CREATE INDEX IF NOT EXISTS idx_campsite_bookings_document_id
  ON campsite_bookings(document_id);
