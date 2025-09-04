-- Create a view for trips that masks sensitive phone number data for non-admin users
CREATE OR REPLACE VIEW public.trips_secure AS
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

-- Enable RLS on the view
ALTER VIEW public.trips_secure SET (security_barrier = true);

-- Grant appropriate permissions
GRANT SELECT ON public.trips_secure TO authenticated;

-- Create RLS policies for the secure view that mirror the trips table policies
CREATE POLICY "Admin can view all trips secure" ON public.trips_secure
FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Drivers can view their own trips secure" ON public.trips_secure  
FOR SELECT USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));

-- Create a similar secure view for maintenance table
CREATE OR REPLACE VIEW public.maintenance_secure AS
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

-- Enable security barrier on maintenance view
ALTER VIEW public.maintenance_secure SET (security_barrier = true);

-- Grant permissions
GRANT SELECT ON public.maintenance_secure TO authenticated;

-- Create RLS policies for maintenance secure view
CREATE POLICY "Admin can view all maintenance secure" ON public.maintenance_secure
FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Drivers can view their own maintenance secure" ON public.maintenance_secure
FOR SELECT USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));