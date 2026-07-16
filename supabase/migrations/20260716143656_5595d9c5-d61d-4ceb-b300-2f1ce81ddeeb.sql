
-- Sync trigger: keep driver_trip_amounts in sync with trips
CREATE OR REPLACE FUNCTION public.sync_driver_trip_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.driver_id IS NOT NULL AND COALESCE(NEW.driver_amount, 0) > 0 THEN
    INSERT INTO public.driver_trip_amounts (driver_id, trip_id, amount, created_by)
    VALUES (NEW.driver_id, NEW.id, NEW.driver_amount, NEW.created_by)
    ON CONFLICT (trip_id) DO UPDATE
      SET driver_id = EXCLUDED.driver_id,
          amount = EXCLUDED.amount;
  ELSE
    DELETE FROM public.driver_trip_amounts WHERE trip_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_driver_trip_amount ON public.trips;
CREATE TRIGGER trg_sync_driver_trip_amount
  AFTER INSERT OR UPDATE OF driver_id, driver_amount ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.sync_driver_trip_amount();

-- Backfill: match existing trips to drivers by name (case-insensitive)
UPDATE public.trips t
SET driver_id = d.id
FROM public.drivers d
WHERE t.driver_id IS NULL
  AND t.driver_name IS NOT NULL
  AND LOWER(TRIM(t.driver_name)) = LOWER(TRIM(d.name));

-- Backfill driver_trip_amounts from existing trips
INSERT INTO public.driver_trip_amounts (driver_id, trip_id, amount, created_by)
SELECT t.driver_id, t.id, t.driver_amount, t.created_by
FROM public.trips t
WHERE t.driver_id IS NOT NULL AND COALESCE(t.driver_amount, 0) > 0
ON CONFLICT (trip_id) DO UPDATE
  SET driver_id = EXCLUDED.driver_id,
      amount = EXCLUDED.amount;
