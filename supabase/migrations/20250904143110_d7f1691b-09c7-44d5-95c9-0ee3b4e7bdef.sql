-- Fix security definer view issues by changing to security invoker
ALTER VIEW public.trips_secure SET (security_invoker = true);
ALTER VIEW public.maintenance_secure SET (security_invoker = true);