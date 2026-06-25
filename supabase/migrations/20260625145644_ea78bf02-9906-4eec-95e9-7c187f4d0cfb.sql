
-- vehicle_fc
CREATE TABLE public.vehicle_fc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number text NOT NULL,
  fc_number text,
  issue_date date NOT NULL,
  expiry_date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_fc TO authenticated;
GRANT ALL ON public.vehicle_fc TO service_role;
ALTER TABLE public.vehicle_fc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all vehicle fc" ON public.vehicle_fc
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Drivers can view their own vehicle fc" ON public.vehicle_fc
  FOR SELECT USING ((NOT public.has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can insert their own vehicle fc" ON public.vehicle_fc
  FOR INSERT WITH CHECK ((NOT public.has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can update their own vehicle fc" ON public.vehicle_fc
  FOR UPDATE USING ((NOT public.has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can delete their own vehicle fc" ON public.vehicle_fc
  FOR DELETE USING ((NOT public.has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));

CREATE TRIGGER trg_vehicle_fc_updated_at
  BEFORE UPDATE ON public.vehicle_fc
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- vehicle_permit (All India Permit)
CREATE TABLE public.vehicle_permit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number text NOT NULL,
  permit_number text,
  issuing_state text,
  issue_date date NOT NULL,
  expiry_date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_permit TO authenticated;
GRANT ALL ON public.vehicle_permit TO service_role;
ALTER TABLE public.vehicle_permit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all vehicle permit" ON public.vehicle_permit
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Drivers can view their own vehicle permit" ON public.vehicle_permit
  FOR SELECT USING ((NOT public.has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can insert their own vehicle permit" ON public.vehicle_permit
  FOR INSERT WITH CHECK ((NOT public.has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can update their own vehicle permit" ON public.vehicle_permit
  FOR UPDATE USING ((NOT public.has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));
CREATE POLICY "Drivers can delete their own vehicle permit" ON public.vehicle_permit
  FOR DELETE USING ((NOT public.has_role(auth.uid(), 'admin'::user_role)) AND (created_by = auth.uid()));

CREATE TRIGGER trg_vehicle_permit_updated_at
  BEFORE UPDATE ON public.vehicle_permit
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
