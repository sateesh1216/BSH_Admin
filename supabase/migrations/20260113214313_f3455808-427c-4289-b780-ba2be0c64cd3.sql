-- Rename travel_name column to vehicle_number in outside_vehicle_trips table
ALTER TABLE public.outside_vehicle_trips RENAME COLUMN travel_name TO vehicle_number;