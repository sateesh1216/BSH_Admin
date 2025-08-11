-- Drop the existing constraint
ALTER TABLE public.trips DROP CONSTRAINT trips_fuel_type_check;

-- Add new constraint with CNG included
ALTER TABLE public.trips ADD CONSTRAINT trips_fuel_type_check 
CHECK (fuel_type = ANY (ARRAY['Petrol'::text, 'Diesel'::text, 'EV'::text, 'CNG'::text]));