-- Remembers which Gmail messages a scan has already examined, per account.
--
-- Without this the scan could never finish a large mailbox. Only IMPORTED
-- messages were remembered, so every run re-fetched the same opening messages
-- in the same deterministic order and stopped at the same time budget: 373 of
-- 493 messages on one account were unreachable by any number of runs, and that
-- is exactly where confirmations booked months ahead live.
--
-- A message is recorded once it has been examined, whatever the verdict, so the
-- next run starts where the last one stopped.

create table if not exists scanned_emails (
  account_email text not null,
  message_id    text not null,
  scanned_at    timestamptz not null default now(),
  primary key (account_email, message_id)
);

create index if not exists scanned_emails_account_idx on scanned_emails (account_email);

alter table scanned_emails enable row level security;

-- Written only by the email-scan edge function, which uses the service role and
-- bypasses RLS. No policy is granted to anon or authenticated clients: this is
-- scanner bookkeeping, not app data.
