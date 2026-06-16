CREATE TABLE public.vehicle_battery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_number TEXT NOT NULL,
  last_replacement_date DATE NOT NULL,
  brand TEXT,
  model TEXT,
  expected_life_months INTEGER NOT NULL DEFAULT 36,
  cost NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_battery TO authenticated;
GRANT ALL ON public.vehicle_battery TO service_role;

ALTER TABLE public.vehicle_battery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own battery records"
  ON public.vehicle_battery FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own battery records"
  ON public.vehicle_battery FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own battery records"
  ON public.vehicle_battery FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own battery records"
  ON public.vehicle_battery FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_vehicle_battery_updated_at
  BEFORE UPDATE ON public.vehicle_battery
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();