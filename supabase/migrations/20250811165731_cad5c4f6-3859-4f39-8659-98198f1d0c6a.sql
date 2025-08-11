-- Fix the profit column to allow proper updates and inserts
ALTER TABLE public.trips ALTER COLUMN profit SET DEFAULT 0;

-- Update any existing NULL profit values to calculated profit
UPDATE public.trips 
SET profit = trip_amount - (driver_amount + commission + fuel_amount + tolls)
WHERE profit IS NULL;