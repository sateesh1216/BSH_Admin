-- Drop the generated column constraint and make it a regular column
ALTER TABLE public.trips ALTER COLUMN profit DROP EXPRESSION;
ALTER TABLE public.trips ALTER COLUMN profit SET DEFAULT 0;

-- Update any existing NULL profit values to calculated profit
UPDATE public.trips 
SET profit = trip_amount - (driver_amount + commission + fuel_amount + tolls)
WHERE profit IS NULL;