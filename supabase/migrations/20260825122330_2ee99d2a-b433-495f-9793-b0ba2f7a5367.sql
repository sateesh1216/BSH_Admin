DROP POLICY IF EXISTS "auth read drivers" ON public.drivers;
CREATE POLICY "owner or admin read drivers" ON public.drivers FOR SELECT TO authenticated
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::user_role));

DROP POLICY IF EXISTS "auth read dex" ON public.driver_expenses;
CREATE POLICY "owner or admin read dex" ON public.driver_expenses FOR SELECT TO authenticated
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::user_role));

DROP POLICY IF EXISTS "auth read dp" ON public.driver_payments;
CREATE POLICY "owner or admin read dp" ON public.driver_payments FOR SELECT TO authenticated
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::user_role));

DROP POLICY IF EXISTS "auth read dta" ON public.driver_trip_amounts;
CREATE POLICY "owner or admin read dta" ON public.driver_trip_amounts FOR SELECT TO authenticated
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::user_role));