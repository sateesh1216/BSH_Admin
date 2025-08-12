-- Update the payment mode check constraint to include Credit Card
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_payment_mode_check;

ALTER TABLE trips ADD CONSTRAINT trips_payment_mode_check 
CHECK (payment_mode = ANY (ARRAY['Cash'::text, 'UPI'::text, 'Online'::text, 'Credit Card'::text, 'Other'::text]));