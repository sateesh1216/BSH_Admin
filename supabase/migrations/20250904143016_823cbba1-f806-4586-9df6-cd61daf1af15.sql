-- Fix security definer view issues by recreating views without security_barrier
DROP VIEW IF EXISTS public.trips_secure;
DROP VIEW IF EXISTS public.maintenance_secure;

-- Create secure views that mask phone numbers for non-admin users
CREATE VIEW public.trips_secure AS
SELECT 
  id,
  date,
  driver_amount,
  commission,
  fuel_amount,
  tolls,
  trip_amount,
  profit,
  created_by,
  created_at,
  updated_at,
  from_location,
  to_location,
  company,
  fuel_type,
  payment_mode,
  driver_name,
  -- Mask phone numbers for non-admin users
  CASE 
    WHEN has_role(auth.uid(), 'admin'::user_role) THEN driver_number
    ELSE CONCAT(LEFT(driver_number, 2), 'XXXXXX', RIGHT(driver_number, 2))
  END AS driver_number,
  customer_name,
  -- Mask customer phone numbers for non-admin users  
  CASE 
    WHEN has_role(auth.uid(), 'admin'::user_role) THEN customer_number
    ELSE CONCAT(LEFT(customer_number, 2), 'XXXXXX', RIGHT(customer_number, 2))
  END AS customer_number
FROM public.trips;

-- Create secure view for maintenance
CREATE VIEW public.maintenance_secure AS
SELECT 
  id,
  date,
  amount,
  created_by,
  created_at,
  updated_at,
  km_at_maintenance,
  next_oil_change_km,
  original_odometer_km,
  vehicle_number,
  driver_name,
  -- Mask phone numbers for non-admin users
  CASE 
    WHEN has_role(auth.uid(), 'admin'::user_role) THEN driver_number
    ELSE CONCAT(LEFT(driver_number, 2), 'XXXXXX', RIGHT(driver_number, 2))
  END AS driver_number,
  maintenance_type,
  description,
  company,
  payment_mode
FROM public.maintenance;

-- Grant permissions to authenticated users
GRANT SELECT ON public.trips_secure TO authenticated;
GRANT SELECT ON public.maintenance_secure TO authenticated;