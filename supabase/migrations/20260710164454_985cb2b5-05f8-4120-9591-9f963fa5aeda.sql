
-- 1) Fix car_numbers overly-permissive policies (also fixes RLS Policy Always True on INSERT)
DROP POLICY IF EXISTS "Authenticated users can view car numbers" ON public.car_numbers;
DROP POLICY IF EXISTS "Authenticated users can insert car numbers" ON public.car_numbers;

CREATE POLICY "Users can view their own car numbers"
  ON public.car_numbers FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Users can insert their own car numbers"
  ON public.car_numbers FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own car numbers"
  ON public.car_numbers FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::user_role));

-- 2) Add user SELECT policy for login_history
CREATE POLICY "Users can view their own login history"
  ON public.login_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3) Fix SECURITY DEFINER view — make trips_secure use invoker's permissions
ALTER VIEW public.trips_secure SET (security_invoker = true);

-- 4) Restrict has_role execution: revoke from anon (still callable by authenticated
--    because RLS policies across the schema depend on it).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.user_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.user_role) TO authenticated, service_role;
