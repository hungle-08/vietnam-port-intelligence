CREATE TABLE IF NOT EXISTS seaports (
  name text PRIMARY KEY,
  region text NOT NULL CHECK (region IN ('north','central','south'))
);
CREATE TABLE IF NOT EXISTS terminals (
  internal_code text PRIMARY KEY,
  source_id text NOT NULL,
  seaport_name text NOT NULL REFERENCES seaports(name),
  name_vi text NOT NULL,
  latitude double precision,
  longitude double precision,
  operational_status text NOT NULL CHECK (operational_status IN ('unverified','active','suspended','closed')),
  payload jsonb NOT NULL,
  CHECK ((latitude IS NULL) = (longitude IS NULL)),
  CHECK (latitude BETWEEN -90 AND 90),
  CHECK (longitude BETWEEN -180 AND 180)
);
CREATE TABLE IF NOT EXISTS terminal_codes (
  terminal_code text NOT NULL REFERENCES terminals(internal_code),
  code_type text NOT NULL,
  code_scope text NOT NULL,
  code_value text NOT NULL,
  source_url text NOT NULL,
  PRIMARY KEY (terminal_code, code_type, code_scope, code_value)
);
CREATE INDEX IF NOT EXISTS terminals_seaport_idx ON terminals(seaport_name);
