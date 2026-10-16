ALTER TABLE vessel_daily_jobs DROP CONSTRAINT vessel_daily_jobs_run_hour_check;
ALTER TABLE vessel_daily_jobs ALTER COLUMN run_hour SET DEFAULT 8;
UPDATE vessel_daily_jobs SET run_hour=8;
ALTER TABLE vessel_daily_jobs ADD CONSTRAINT vessel_daily_jobs_run_hour_check CHECK (run_hour=8);
WITH schedule AS (
 SELECT id,
 (date_trunc('day',next_run_at AT TIME ZONE 'Asia/Ho_Chi_Minh')+interval '8 hours') AT TIME ZONE 'Asia/Ho_Chi_Minh' AS shifted,
 (date_trunc('day',now() AT TIME ZONE 'Asia/Ho_Chi_Minh')+interval '8 hours'+CASE WHEN (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::time>=time '08:00' THEN interval '1 day' ELSE interval '0 days' END) AT TIME ZONE 'Asia/Ho_Chi_Minh' AS upcoming
 FROM vessel_daily_jobs WHERE id='php-vessel-dwt'
)
UPDATE vessel_daily_jobs j SET next_run_at=greatest(schedule.shifted,schedule.upcoming),revision=revision+1,updated_at=now() FROM schedule WHERE j.id=schedule.id;
