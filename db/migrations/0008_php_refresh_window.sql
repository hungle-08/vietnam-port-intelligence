ALTER TABLE vessel_daily_jobs ADD CONSTRAINT php_refresh_window CHECK (interval_days BETWEEN 1 AND 4);
