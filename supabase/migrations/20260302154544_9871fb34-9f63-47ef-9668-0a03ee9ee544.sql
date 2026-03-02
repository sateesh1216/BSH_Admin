
-- Oil Change tracking (date-based expiry)
CREATE TABLE public.vehicle_oil_change (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_number TEXT NOT NULL,
  last_oil_change_date DATE NOT NULL,
  last_oil_change_km INTEGER NOT NULL DEFAULT 0,
  next_oil_change_km INTEGER,
  next_oil_change_date DATE,
  oil_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.vehicle_oil_change ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all vehicle oil change" ON public.vehicle_oil_change FOR ALL USING (has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Drivers can view their own vehicle oil change" ON public.vehicle_oil_change FOR SELECT USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can insert their own vehicle oil change" ON public.vehicle_oil_change FOR INSERT WITH CHECK ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can update their own vehicle oil change" ON public.vehicle_oil_change FOR UPDATE USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can delete their own vehicle oil change" ON public.vehicle_oil_change FOR DELETE USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));

-- Insurance Renewal tracking (date-based expiry)
CREATE TABLE public.vehicle_insurance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_number TEXT NOT NULL,
  insurance_company TEXT,
  policy_number TEXT,
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  premium_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.vehicle_insurance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all vehicle insurance" ON public.vehicle_insurance FOR ALL USING (has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Drivers can view their own vehicle insurance" ON public.vehicle_insurance FOR SELECT USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can insert their own vehicle insurance" ON public.vehicle_insurance FOR INSERT WITH CHECK ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can update their own vehicle insurance" ON public.vehicle_insurance FOR UPDATE USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can delete their own vehicle insurance" ON public.vehicle_insurance FOR DELETE USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));

-- Pollution (PUC) Certificate tracking (date-based expiry)
CREATE TABLE public.vehicle_pollution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_number TEXT NOT NULL,
  certificate_number TEXT,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.vehicle_pollution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all vehicle pollution" ON public.vehicle_pollution FOR ALL USING (has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Drivers can view their own vehicle pollution" ON public.vehicle_pollution FOR SELECT USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can insert their own vehicle pollution" ON public.vehicle_pollution FOR INSERT WITH CHECK ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can update their own vehicle pollution" ON public.vehicle_pollution FOR UPDATE USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can delete their own vehicle pollution" ON public.vehicle_pollution FOR DELETE USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
