CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number text NOT NULL UNIQUE,
  make text,
  model text,
  year integer,
  colour text,
  fuel_type text,
  owner_name text,
  registration_date date,
  purchase_date date,
  chassis_number text,
  engine_number text,
  seating_capacity integer,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view vehicles"
  ON public.vehicles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can add vehicles"
  ON public.vehicles FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners or admins can update vehicles"
  ON public.vehicles FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners or admins can delete vehicles"
  ON public.vehicles FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();