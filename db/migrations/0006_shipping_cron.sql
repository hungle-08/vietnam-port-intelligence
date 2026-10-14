CREATE TABLE admin_job_configs (
 id text PRIMARY KEY,
 name text NOT NULL,
 enabled boolean NOT NULL DEFAULT true,
 interval_months integer NOT NULL CHECK (interval_months BETWEEN 1 AND 12),
 day_of_month integer NOT NULL CHECK (day_of_month BETWEEN 1 AND 28),
 source_id text NOT NULL CHECK (source_id='alphaliner'),
 source_url text NOT NULL CHECK (source_url IN ('https://alphaliner.axsmarine.com/PublicTop100/','https://alphaliner.axsmarine.com/PublicTop100/rooter.php')),
 next_run_at timestamptz NOT NULL,
 revision integer NOT NULL DEFAULT 1,
 lease_token uuid,
 lease_until timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid REFERENCES auth_users(id)
);
CREATE TABLE admin_job_runs (
 id uuid PRIMARY KEY,
 job_id text NOT NULL REFERENCES admin_job_configs(id),
 config_revision integer NOT NULL,
 source_url text NOT NULL,
 scheduled_for timestamptz NOT NULL,
 started_at timestamptz NOT NULL DEFAULT now(),
 finished_at timestamptz,
 status text NOT NULL CHECK (status IN ('running','success','failed','interrupted')),
 message text,
 snapshot_id text REFERENCES shipping_fleet_snapshots(id)
);
CREATE INDEX admin_job_runs_history ON admin_job_runs(job_id,started_at DESC);
INSERT INTO admin_job_configs(id,name,interval_months,day_of_month,source_id,source_url,next_run_at)
VALUES('shipping-top-ten','Top 10 hãng tàu lớn nhất thế giới',1,1,'alphaliner','https://alphaliner.axsmarine.com/PublicTop100/',(date_trunc('month',now() AT TIME ZONE 'UTC')+interval '1 month') AT TIME ZONE 'UTC');
