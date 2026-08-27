DO $$
DECLARE
  t text;
  p record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'vehicles','vehicle_emi','vehicle_alignment','vehicle_oil_change',
    'vehicle_insurance','vehicle_pollution','vehicle_fc','vehicle_permit','vehicle_battery'
  ] LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
    END LOOP;

    EXECUTE format('CREATE POLICY "Own or admin can view %1$s" ON public.%1$I FOR SELECT TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(), ''admin''))', t);
    EXECUTE format('CREATE POLICY "Users can insert own %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid())', t);
    EXECUTE format('CREATE POLICY "Own or admin can update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(), ''admin'')) WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), ''admin''))', t);
    EXECUTE format('CREATE POLICY "Own or admin can delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(), ''admin''))', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Authenticated can view car numbers" ON public.car_numbers;

CREATE POLICY "Own or admin can view car numbers"
  ON public.car_numbers FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));