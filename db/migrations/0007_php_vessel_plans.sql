CREATE TABLE issuer_terminal_sites (
 id text PRIMARY KEY,
 name text NOT NULL,
 operator_name text NOT NULL,
 region text NOT NULL DEFAULT 'north',
 city text NOT NULL DEFAULT 'Hải Phòng',
 location_precision text NOT NULL DEFAULT 'terminal-name',
 payload jsonb NOT NULL
);
CREATE TABLE issuer_terminal_memberships (
 ticker text NOT NULL REFERENCES port_entities(internal_code),
 terminal_id text NOT NULL REFERENCES issuer_terminal_sites(id),
 relation text NOT NULL,
 ownership_percent numeric(5,2) NOT NULL CHECK (ownership_percent BETWEEN 0 AND 100),
 scope text NOT NULL CHECK (scope IN ('direct','system')),
 valid_from date NOT NULL,
 valid_to date,
 evidence_as_of date NOT NULL,
 source_url text NOT NULL,
 PRIMARY KEY(ticker,terminal_id,valid_from)
);
CREATE TABLE vessel_plan_snapshots (
 id text PRIMARY KEY,
 source_id text NOT NULL DEFAULT 'haiphong-maritime-authority',
 plan_date date NOT NULL,
 fetched_at timestamptz NOT NULL,
 last_seen_at timestamptz NOT NULL,
 source_url text NOT NULL,
 content_hash text NOT NULL,
 raw_html text NOT NULL,
 event_count integer NOT NULL CHECK (event_count>=0),
 duplicate_count integer NOT NULL DEFAULT 0,
 UNIQUE(source_id,plan_date,content_hash)
);
CREATE TABLE vessel_plan_events (
 snapshot_id text NOT NULL REFERENCES vessel_plan_snapshots(id),
 event_key text NOT NULL,
 movement text NOT NULL CHECK (movement IN ('arrival','departure','transfer','transit')),
 vessel_name text NOT NULL,
 planned_time time,
 dwt numeric(14,3) CHECK (dwt>0),
 from_terminal text REFERENCES issuer_terminal_sites(id),
 to_terminal text REFERENCES issuer_terminal_sites(id),
 status text NOT NULL DEFAULT 'planned' CHECK (status='planned'),
 call_match_status text NOT NULL DEFAULT 'unlinked' CHECK (call_match_status='unlinked'),
 payload jsonb NOT NULL,
 PRIMARY KEY(snapshot_id,event_key)
);
CREATE INDEX vessel_plan_events_to ON vessel_plan_events(to_terminal,movement);
CREATE TABLE vessel_plan_days (
 source_id text NOT NULL,
 plan_date date NOT NULL,
 snapshot_id text NOT NULL REFERENCES vessel_plan_snapshots(id),
 observed_at timestamptz NOT NULL,
 PRIMARY KEY(source_id,plan_date)
);
CREATE TABLE vessel_plan_coverage (
 plan_date date PRIMARY KEY,
 last_attempt_at timestamptz NOT NULL DEFAULT now(),
 status text NOT NULL CHECK (status IN ('complete','empty','failed')),
 message text,
 attempts integer NOT NULL DEFAULT 1
);
CREATE TABLE vessel_backfill_checkpoints (
 id text PRIMARY KEY,
 start_date date NOT NULL,
 end_date date NOT NULL,
 last_processed_date date,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE vessel_daily_jobs (
 id text PRIMARY KEY,
 enabled boolean NOT NULL DEFAULT true,
 interval_days integer NOT NULL DEFAULT 1 CHECK (interval_days BETWEEN 1 AND 30),
 run_hour integer NOT NULL DEFAULT 0 CHECK (run_hour=0),
 timezone text NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
 source_url text NOT NULL,
 next_run_at timestamptz NOT NULL,
 revision integer NOT NULL DEFAULT 1,
 lease_token uuid,
 lease_until timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid REFERENCES auth_users(id)
);
INSERT INTO vessel_daily_jobs(id,source_url,next_run_at) VALUES('php-vessel-dwt','https://cangvuhaiphong.gov.vn/ke-hoach-tau/',((now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date+1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh');
CREATE TABLE vessel_daily_job_runs (
 id uuid PRIMARY KEY,
 job_id text NOT NULL REFERENCES vessel_daily_jobs(id),
 started_at timestamptz NOT NULL DEFAULT now(),
 finished_at timestamptz,
 status text NOT NULL CHECK (status IN ('running','success','failed','interrupted')),
 message text,
 days_saved integer NOT NULL DEFAULT 0
);
CREATE VIEW issuer_daily_planned_dwt AS
SELECT m.ticker,m.scope,d.plan_date,e.to_terminal AS terminal_id,count(*)::integer AS planned_arrivals,
 sum(e.dwt) AS known_dwt,count(*) FILTER (WHERE e.dwt IS NULL)::integer AS missing_dwt
FROM vessel_plan_days d JOIN vessel_plan_events e ON e.snapshot_id=d.snapshot_id
JOIN issuer_terminal_memberships m ON m.terminal_id=e.to_terminal AND d.plan_date>=m.valid_from AND (m.valid_to IS NULL OR d.plan_date<=m.valid_to)
WHERE e.movement='arrival'
GROUP BY m.ticker,m.scope,d.plan_date,e.to_terminal;
