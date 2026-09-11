-- Daily Trip Watch: server-side state for detecting material changes to
-- tomorrow's conditions, and a durable record of what was surfaced.
--
-- Detection state and delivered alerts are separate tables on purpose: the
-- first exists so the next run can compare instead of repeating itself, the
-- second is the record of what a person was actually told.

CREATE TABLE IF NOT EXISTS trip_watch_state (
  target_date   DATE        NOT NULL,
  key           TEXT        NOT NULL,
  severity      TEXT        NOT NULL CHECK (severity IN ('critical','major','minor','info')),
  summary       TEXT        NOT NULL,
  last_seen_at  TIMESTAMPTZ NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (target_date, key)
);

CREATE TABLE IF NOT EXISTS trip_alerts (
  id           TEXT        PRIMARY KEY,
  target_date  DATE        NOT NULL,
  key          TEXT        NOT NULL,
  severity     TEXT        NOT NULL CHECK (severity IN ('critical','major','minor','info')),
  summary      TEXT        NOT NULL,
  source_url   TEXT,
  change_kind  TEXT        NOT NULL CHECK (change_kind IN ('new','worsened','unchanged','resolved')),
  acknowledged BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_alerts_date ON trip_alerts(target_date, created_at DESC);

ALTER TABLE trip_watch_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_alerts ENABLE ROW LEVEL SECURITY;

-- Same posture as the existing tables in this project (single trusted family).
CREATE POLICY "Allow all access" ON trip_watch_state FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON trip_alerts FOR ALL USING (true) WITH CHECK (true);

-- ─── Schedule ───────────────────────────────────────────────────────────────
-- Requires pg_cron and pg_net, both already enabled on this project
-- (pg_cron 1.6.4, pg_net 0.20.0). Run the statements below manually in the
-- SQL Editor; migrations do not create cron jobs.
--
-- IMPORTANT, learned the hard way. Do NOT copy the pattern in
-- 006_email_scan_cron.sql. It reads the URL and service key from
-- current_setting('app.settings.*'), and those parameters do not exist in this
-- database. The live 'email-scan-6h' job was written with the sibling variant
-- current_setting('supabase.service_role_key'), which does not exist either, and
-- has therefore failed on every single run:
--
--   status  runs  latest                     return_message
--   failed  311   2026-09-11 12:00:00+00     ERROR: unrecognized configuration
--                                            parameter "supabase.service_role_key"
--
-- A cron job that raises inside its command never reaches net.http_post, so the
-- function is never called and nothing is logged on the function side. The
-- failure is completely silent unless you read cron.job_run_details. See
-- 015_fix_email_scan_cron.sql for the repair of that job.
--
-- The pattern below uses a literal URL and sends no Authorization header,
-- because trip-watch is deployed with verify_jwt = false, like every other
-- function in this project. Verified: an unauthenticated request from pg_net
-- reaches the function and is answered by the function itself, not rejected by
-- the gateway. No secret is stored in cron.job, which is a plain table.
--
-- If verify_jwt is ever turned on for trip-watch, do not inline the service key
-- here. Put it in Vault (the supabase_vault extension is installed) and read it
-- back in the command:
--
--   'Authorization', 'Bearer ' || (
--     SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key'
--   )
--
-- Cadence for the trip (times are UTC; the trip runs in UTC-6/-7):
--   13:00 UTC ≈ 06:00 Mountain — morning check of the day ahead
--   02:00 UTC ≈ 19:00 Mountain — evening check of tomorrow
-- Change the cron expressions to change the cadence; nothing else depends on it.
--
-- SELECT cron.schedule(
--   'trip-watch-morning',
--   '0 13 * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://lsmqhowvmqwgztpnshbc.supabase.co/functions/v1/trip-watch',
--     headers := jsonb_build_object('Content-Type', 'application/json'),
--     body := '{}'::jsonb
--   );
--   $$
-- );
--
-- SELECT cron.schedule(
--   'trip-watch-evening',
--   '0 2 * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://lsmqhowvmqwgztpnshbc.supabase.co/functions/v1/trip-watch',
--     headers := jsonb_build_object('Content-Type', 'application/json'),
--     body := '{}'::jsonb
--   );
--   $$
-- );
--
-- ─── Verify the schedule actually runs ──────────────────────────────────────
-- A scheduled job is not working just because cron.schedule returned an id.
-- Check after the first firing, and treat anything other than 'succeeded' as a
-- broken job:
--
--   SELECT j.jobname, d.status, d.start_time, left(d.return_message, 200)
--   FROM cron.job j
--   JOIN cron.job_run_details d ON d.jobid = j.jobid
--   WHERE j.jobname LIKE 'trip-watch%'
--   ORDER BY d.start_time DESC
--   LIMIT 10;
