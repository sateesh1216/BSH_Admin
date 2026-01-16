-- Add car_number column to trips table
ALTER TABLE public.trips ADD COLUMN car_number text;

-- Also add to outside_vehicle_trips for consistency
ALTER TABLE public.outside_vehicle_trips ADD COLUMN car_number text;