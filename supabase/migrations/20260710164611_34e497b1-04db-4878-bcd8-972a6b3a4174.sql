
-- Replace access_requests INSERT policy that used WITH CHECK (true)
DROP POLICY IF EXISTS "Anyone can submit access requests" ON public.access_requests;

CREATE POLICY "Anyone can submit access requests"
  ON public.access_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(trim(email)) > 3
    AND full_name IS NOT NULL
    AND length(trim(full_name)) > 0
    AND status = 'pending'
  );

-- Lock down internal trigger helper functions so they cannot be invoked via PostgREST/RPC
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
