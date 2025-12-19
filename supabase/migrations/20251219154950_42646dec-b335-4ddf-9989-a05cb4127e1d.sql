-- Recalculate profit for all trips
UPDATE trips 
SET profit = trip_amount - driver_amount - commission - fuel_amount - tolls
WHERE profit = 0 OR profit IS NULL;