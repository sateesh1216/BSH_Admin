-- Remove unnecessary columns from maintenance table for car maintenance
ALTER TABLE public.maintenance 
DROP COLUMN IF EXISTS customer_name,
DROP COLUMN IF EXISTS customer_number, 
DROP COLUMN IF EXISTS commission,
DROP COLUMN IF EXISTS fuel_amount,
DROP COLUMN IF EXISTS tolls,
DROP COLUMN IF EXISTS fuel_type;