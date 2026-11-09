CREATE TABLE cdn_vessels (
 id bigserial PRIMARY KEY,
 imo text UNIQUE,
 vessel_name text NOT NULL,
 dwt numeric(14,3) CHECK (dwt > 0),
 dwt_source text,
 dwt_observed_at timestamptz,
 match_status text NOT NULL DEFAULT 'pending' CHECK (match_status IN ('pending','verified','unmatched','ambiguous')),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE cdn_arrivals (
 source_id text PRIMARY KEY,
 source_url text NOT NULL,
 vessel_name text NOT NULL,
 carrier text,
 voyage text,
 berth text NOT NULL,
 terminal text CHECK (terminal IS NULL OR terminal='tien-sa'),
 atb timestamptz NOT NULL,
 teu integer CHECK (teu >= 0),
 containers integer CHECK (containers >= 0),
 vessel_id bigint REFERENCES cdn_vessels(id),
 first_seen_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cdn_arrivals_atb_idx ON cdn_arrivals(atb);
CREATE TABLE cdn_source_queue (
 source_id text PRIMARY KEY,
 source_url text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
 attempts integer NOT NULL DEFAULT 0,
 last_attempt_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE cdn_sync_config (
 id text PRIMARY KEY,
 enabled boolean NOT NULL DEFAULT true,
 source_url text NOT NULL,
 run_hour integer NOT NULL DEFAULT 7 CHECK (run_hour=7),
 timezone text NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
 last_run_at timestamptz,
 last_status text,
 last_message text,
 lease_token uuid,
 lease_until timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO cdn_sync_config(id,source_url) VALUES ('cdn-arrivals','https://danangport.com/tra-cuu-tau-container/') ON CONFLICT DO NOTHING;
CREATE TABLE cdn_dwt_lookups (
 vessel_name text PRIMARY KEY,
 candidates jsonb NOT NULL DEFAULT '[]'::jsonb,
 source_url text NOT NULL,
 checked_at timestamptz NOT NULL DEFAULT now()
);
