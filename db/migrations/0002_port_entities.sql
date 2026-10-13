CREATE TABLE IF NOT EXISTS port_entities (
 internal_code text PRIMARY KEY,
 source_id text NOT NULL,
 name_vi text NOT NULL,
 entity_type text NOT NULL CHECK (entity_type IN ('port','group')),
 stock_ticker text,
 latitude double precision,
 longitude double precision,
 payload jsonb NOT NULL,
 CHECK ((latitude IS NULL) = (longitude IS NULL)),
 CHECK (latitude BETWEEN -90 AND 90),
 CHECK (longitude BETWEEN -180 AND 180)
);
