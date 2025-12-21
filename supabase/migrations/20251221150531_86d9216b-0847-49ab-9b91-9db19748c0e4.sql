-- Add payment_status column to trips table
ALTER TABLE public.trips 
ADD COLUMN payment_status text NOT NULL DEFAULT 'pending';

-- Update existing trips to 'paid' if trip_amount > 0 (assuming existing records were paid)
UPDATE public.trips SET payment_status = 'paid' WHERE trip_amount > 0;

-- Add to trips_secure view
DROP VIEW IF EXISTS public.trips_secure;
CREATE VIEW public.trips_secure AS
SELECT 
  id,
  date,
  driver_name,
  driver_number,
  customer_name,
  customer_number,
  from_location,
  to_location,
  company,
  fuel_type,
  payment_mode,
  payment_status,
  driver_amount,
  commission,
  fuel_amount,
  tolls,
  trip_amount,
  profit,
  created_by,
  created_at,
  updated_at
FROM public.trips
WHERE created_by = auth.uid() OR has_role(auth.uid(), 'admin'::user_role);