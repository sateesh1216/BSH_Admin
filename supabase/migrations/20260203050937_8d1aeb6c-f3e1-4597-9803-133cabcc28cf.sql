-- Create car_numbers table to store car numbers that can be reused
CREATE TABLE public.car_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_number TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.car_numbers ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view car numbers
CREATE POLICY "Authenticated users can view car numbers"
ON public.car_numbers
FOR SELECT
TO authenticated
USING (true);

-- All authenticated users can insert car numbers
CREATE POLICY "Authenticated users can insert car numbers"
ON public.car_numbers
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Insert default car numbers
INSERT INTO public.car_numbers (car_number) VALUES 
  ('AP39UF1216'),
  ('AP39UB7671'),
  ('AP39TZ0492'),
  ('AP39UE9498')
ON CONFLICT (car_number) DO NOTHING;