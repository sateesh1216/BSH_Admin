-- Add missing columns to maintenance table to match trips table structure
ALTER TABLE public.maintenance 
ADD COLUMN IF NOT EXISTS driver_number text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS customer_name text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS customer_number text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS company text,
ADD COLUMN IF NOT EXISTS payment_mode text NOT NULL DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS fuel_type text NOT NULL DEFAULT 'petrol',
ADD COLUMN IF NOT EXISTS commission numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS fuel_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS tolls numeric NOT NULL DEFAULT 0;

-- Update maintenance table to remove the default empty string constraint for driver_number, customer_name, customer_number
ALTER TABLE public.maintenance 
ALTER COLUMN driver_number DROP DEFAULT,
ALTER COLUMN customer_name DROP DEFAULT,
ALTER COLUMN customer_number DROP DEFAULT;