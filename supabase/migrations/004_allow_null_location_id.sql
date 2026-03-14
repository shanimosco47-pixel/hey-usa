-- Allow notes without a location (general "fridge" notes)
ALTER TABLE location_notes ALTER COLUMN location_id DROP NOT NULL;
