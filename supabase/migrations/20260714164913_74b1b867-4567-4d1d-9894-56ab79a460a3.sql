
-- Drivers module tables

CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mobile text,
  license_number text,
  address text,
  aadhaar text,
  joining_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read drivers" ON public.drivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert drivers" ON public.drivers FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "creator or admin update drivers" ON public.drivers FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "creator or admin delete drivers" ON public.drivers FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER drivers_updated_at BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.driver_trip_amounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(trip_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_trip_amounts TO authenticated;
GRANT ALL ON public.driver_trip_amounts TO service_role;
ALTER TABLE public.driver_trip_amounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read dta" ON public.driver_trip_amounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert dta" ON public.driver_trip_amounts FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "creator or admin update dta" ON public.driver_trip_amounts FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "creator or admin delete dta" ON public.driver_trip_amounts FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.driver_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  expense_type text NOT NULL CHECK (expense_type IN ('fuel','food','toll','advance','repair','other')),
  amount numeric NOT NULL DEFAULT 0,
  description text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_expenses TO authenticated;
GRANT ALL ON public.driver_expenses TO service_role;
ALTER TABLE public.driver_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read dex" ON public.driver_expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert dex" ON public.driver_expenses FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "creator or admin update dex" ON public.driver_expenses FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "creator or admin delete dex" ON public.driver_expenses FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER dex_updated_at BEFORE UPDATE ON public.driver_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.driver_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  payment_amount numeric NOT NULL DEFAULT 0,
  payment_mode text NOT NULL CHECK (payment_mode IN ('cash','bank','upi')),
  reference_number text,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_payments TO authenticated;
GRANT ALL ON public.driver_payments TO service_role;
ALTER TABLE public.driver_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read dp" ON public.driver_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert dp" ON public.driver_payments FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "creator or admin update dp" ON public.driver_payments FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "creator or admin delete dp" ON public.driver_payments FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER dp_updated_at BEFORE UPDATE ON public.driver_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add driver_id link on trips (nullable, backward compatible)
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL;
