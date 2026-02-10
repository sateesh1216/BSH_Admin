
-- Vehicle EMI tracking
CREATE TABLE public.vehicle_emi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_number TEXT NOT NULL,
  emi_amount NUMERIC NOT NULL DEFAULT 0,
  emi_day INTEGER NOT NULL DEFAULT 20,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vehicle_emi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all vehicle EMI" ON public.vehicle_emi FOR ALL USING (has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Drivers can view their own vehicle EMI" ON public.vehicle_emi FOR SELECT USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can manage their own vehicle EMI" ON public.vehicle_emi FOR INSERT WITH CHECK ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can update their own vehicle EMI" ON public.vehicle_emi FOR UPDATE USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can delete their own vehicle EMI" ON public.vehicle_emi FOR DELETE USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));

-- Vehicle alignment tracking
CREATE TABLE public.vehicle_alignment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_number TEXT NOT NULL,
  last_alignment_km INTEGER NOT NULL DEFAULT 0,
  alignment_interval_km INTEGER NOT NULL DEFAULT 10000,
  last_alignment_date DATE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vehicle_alignment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all vehicle alignment" ON public.vehicle_alignment FOR ALL USING (has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Drivers can view their own vehicle alignment" ON public.vehicle_alignment FOR SELECT USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can manage their own vehicle alignment" ON public.vehicle_alignment FOR INSERT WITH CHECK ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can update their own vehicle alignment" ON public.vehicle_alignment FOR UPDATE USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can delete their own vehicle alignment" ON public.vehicle_alignment FOR DELETE USING ((NOT has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
