-- Restore regional storage while issuer_daily_planned_dwt remains scoped by terminal memberships.
ALTER TABLE vessel_plan_events DROP CONSTRAINT IF EXISTS php_event_storage_scope;
