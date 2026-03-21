CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  last_scan_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_email_id TEXT;
CREATE INDEX IF NOT EXISTS idx_documents_source_email ON documents (source_email_id);
