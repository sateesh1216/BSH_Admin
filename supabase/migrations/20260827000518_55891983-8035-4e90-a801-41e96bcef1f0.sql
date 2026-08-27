DROP POLICY IF EXISTS "Users can view their own car numbers" ON public.car_numbers;

CREATE POLICY "Authenticated can view car numbers"
  ON public.car_numbers FOR SELECT TO authenticated USING (true);