CREATE TABLE IF NOT EXISTS shipping_carriers (
 id text PRIMARY KEY,
 name text NOT NULL,
 short_name text NOT NULL,
 website text NOT NULL,
 logo_url text NOT NULL,
 payload jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS shipping_fleet_snapshots (
 id text PRIMARY KEY,
 source_id text NOT NULL,
 as_of date NOT NULL,
 retrieved_at timestamptz NOT NULL,
 source_url text NOT NULL,
 metric text NOT NULL CHECK (metric='operated-container-capacity-teu'),
 scope text NOT NULL CHECK (scope='consolidated'),
 content_hash text NOT NULL,
 metadata jsonb NOT NULL,
 UNIQUE(source_id,as_of,content_hash)
);
CREATE INDEX IF NOT EXISTS shipping_snapshots_latest ON shipping_fleet_snapshots (as_of DESC,retrieved_at DESC);
CREATE TABLE IF NOT EXISTS shipping_fleet_rankings (
 snapshot_id text NOT NULL REFERENCES shipping_fleet_snapshots(id),
 carrier_id text NOT NULL REFERENCES shipping_carriers(id),
 rank integer NOT NULL CHECK (rank BETWEEN 1 AND 10),
 source_name text NOT NULL,
 capacity_teu bigint NOT NULL CHECK (capacity_teu>0),
 ship_count integer CHECK (ship_count>0),
 share_percent numeric(5,2) NOT NULL CHECK (share_percent>0 AND share_percent<=100),
 PRIMARY KEY(snapshot_id,carrier_id),
 UNIQUE(snapshot_id,rank)
);
CREATE TABLE IF NOT EXISTS shipping_carrier_port_links (
 carrier_id text NOT NULL REFERENCES shipping_carriers(id),
 port_code text NOT NULL REFERENCES port_entities(internal_code),
 relationship text NOT NULL CHECK (relationship IN ('port-call','service','ownership')),
 valid_from date NOT NULL,
 valid_to date,
 source_url text NOT NULL,
 verified_at timestamptz NOT NULL,
 PRIMARY KEY(carrier_id,port_code,relationship,valid_from),
 CHECK (valid_to IS NULL OR valid_to>=valid_from)
);
