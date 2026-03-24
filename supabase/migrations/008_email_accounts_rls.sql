-- Enable RLS on email_accounts (was missing from 005)
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

-- Allow anon access (PIN-based app, same pattern as other tables)
CREATE POLICY "Allow all access" ON email_accounts
  FOR ALL USING (true) WITH CHECK (true);
