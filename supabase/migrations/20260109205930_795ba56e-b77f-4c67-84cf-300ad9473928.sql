-- Create table for outside vehicle trips
CREATE TABLE public.outside_vehicle_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  driver_name TEXT NOT NULL,
  driver_number TEXT NOT NULL,
  travel_company TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  travel_name TEXT NOT NULL,
  trip_given_company TEXT NOT NULL,
  payment_mode TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  trip_amount NUMERIC NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.outside_vehicle_trips ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admin can view all outside vehicle trips"
ON public.outside_vehicle_trips FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admin can insert all outside vehicle trips"
ON public.outside_vehicle_trips FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admin can update all outside vehicle trips"
ON public.outside_vehicle_trips FOR UPDATE
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admin can delete all outside vehicle trips"
ON public.outside_vehicle_trips FOR DELETE
USING (has_role(auth.uid(), 'admin'::user_role));

-- Driver policies
CREATE POLICY "Drivers can view their own outside vehicle trips"
ON public.outside_vehicle_trips FOR SELECT
USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));

CREATE POLICY "Drivers can insert their own outside vehicle trips"
ON public.outside_vehicle_trips FOR INSERT
WITH CHECK ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));

CREATE POLICY "Drivers can update their own outside vehicle trips"
ON public.outside_vehicle_trips FOR UPDATE
USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));

CREATE POLICY "Drivers can delete their own outside vehicle trips"
ON public.outside_vehicle_trips FOR DELETE
USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_outside_vehicle_trips_updated_at
BEFORE UPDATE ON public.outside_vehicle_trips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();