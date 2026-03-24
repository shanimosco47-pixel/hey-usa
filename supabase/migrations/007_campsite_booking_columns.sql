-- Add cancellation terms and source tracking to campsite_bookings
ALTER TABLE campsite_bookings
  ADD COLUMN IF NOT EXISTS cancellation_deadline TEXT,
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
