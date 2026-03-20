-- Schedule daily booking alert checker at 08:00 Israel time (05:00 UTC)
-- Requires pg_cron and pg_net extensions (enable in Supabase dashboard first)

-- This migration is a reference — run manually via Supabase SQL Editor
-- after enabling the extensions:

-- SELECT cron.schedule(
--   'booking-alerts-daily',
--   '0 5 * * *',
--   $$
--   SELECT net.http_post(
--     url := current_setting('app.settings.supabase_url') || '/functions/v1/booking-alerts',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
