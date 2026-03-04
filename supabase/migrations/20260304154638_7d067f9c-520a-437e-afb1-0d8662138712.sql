-- Schedule monthly report email on the last day of every month at 11:30 PM IST (18:00 UTC)
SELECT cron.schedule(
  'send-monthly-report-last-day',
  '0 18 28-31 * *',
  $$
  SELECT
    CASE
      WHEN date_trunc('month', now() + interval '1 day') > date_trunc('month', now())
      THEN net.http_post(
        url := 'https://hecnhsynlpachotmpmjg.supabase.co/functions/v1/send-monthly-report',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlY25oc3lubHBhY2hvdG1wbWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODk3MzAsImV4cCI6MjA3MDA2NTczMH0.TDFXEUsMFXXa_pO2jtXeid701V1Wib-x9lQ3keakmOc"}'::jsonb,
        body := concat('{"month": "', to_char(now(), 'YYYY-MM'), '"}')::jsonb
      )
    END;
  $$
);