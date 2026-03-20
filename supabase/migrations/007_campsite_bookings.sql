-- Campsite booking tracker: nights needing reservations + options per night

CREATE TABLE IF NOT EXISTS campsite_nights (
  id              TEXT PRIMARY KEY,
  check_in_date   DATE NOT NULL,
  check_out_date  DATE NOT NULL,
  itinerary_day_id TEXT,
  location_name   TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'searching',  -- searching | booked | skipped
  booked_option_id TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE campsite_nights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON campsite_nights FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS campsite_options (
  id                TEXT PRIMARY KEY,
  night_id          TEXT NOT NULL REFERENCES campsite_nights(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  platform          TEXT,            -- recreation_gov | reserve_america | private | other
  platform_url      TEXT,
  facility_id       TEXT,            -- Recreation.gov facility ID
  price_per_night   NUMERIC,
  rv_friendly       BOOLEAN NOT NULL DEFAULT true,
  hookups           TEXT,            -- full | partial | none
  max_rv_length     INTEGER,         -- in feet
  booking_opens_at  TIMESTAMPTZ,
  alert_sent        BOOLEAN NOT NULL DEFAULT false,
  booking_status    TEXT NOT NULL DEFAULT 'not_yet_open', -- not_yet_open | open | booked | sold_out | skipped
  family_rating     INTEGER CHECK (family_rating IS NULL OR (family_rating BETWEEN 1 AND 5)),
  priority          INTEGER NOT NULL DEFAULT 0,  -- 1 = top pick, 2 = backup, 3 = fallback, 0 = unranked
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE campsite_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON campsite_options FOR ALL USING (true) WITH CHECK (true);
