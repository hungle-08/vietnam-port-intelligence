ALTER TABLE vietnam_trade_sync_config RENAME COLUMN interval_days TO interval_months;
ALTER TABLE vietnam_trade_sync_config DROP CONSTRAINT vietnam_trade_sync_config_interval_days_check;
ALTER TABLE vietnam_trade_sync_config ALTER COLUMN interval_months SET DEFAULT 1;
UPDATE vietnam_trade_sync_config SET interval_months=1;
ALTER TABLE vietnam_trade_sync_config ADD CONSTRAINT vietnam_trade_monthly_interval CHECK (interval_months=1);
ALTER TABLE vietnam_trade_sync_config ADD COLUMN day_of_month integer NOT NULL DEFAULT 25 CHECK (day_of_month=25);
UPDATE vietnam_trade_sync_config SET next_run_at=CASE WHEN date_trunc('month',now() AT TIME ZONE 'UTC')+interval '24 days 1 hour'>now() AT TIME ZONE 'UTC' THEN (date_trunc('month',now() AT TIME ZONE 'UTC')+interval '24 days 1 hour') AT TIME ZONE 'UTC' ELSE (date_trunc('month',now() AT TIME ZONE 'UTC')+interval '1 month 24 days 1 hour') AT TIME ZONE 'UTC' END,revision=revision+1,updated_at=now();
