-- Add missing KM columns to maintenance table
ALTER TABLE public.maintenance 
ADD COLUMN IF NOT EXISTS km_at_maintenance INTEGER,
ADD COLUMN IF NOT EXISTS next_oil_change_km INTEGER,
ADD COLUMN IF NOT EXISTS original_odometer_km INTEGER;