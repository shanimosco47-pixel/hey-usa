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
-- Requires pg_cron and pg_net enabled in the Supabase dashboard first
-- (Database → Extensions), exactly like 006_email_scan_cron.sql. Run the
-- statements below manually in the SQL Editor.
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
--     url := current_setting('app.settings.supabase_url') || '/functions/v1/trip-watch',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
--     ),
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
--     url := current_setting('app.settings.supabase_url') || '/functions/v1/trip-watch',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
