ALTER TABLE cdn_dwt_lookups ADD COLUMN IF NOT EXISTS wikidata_checked_at timestamptz;
ALTER TABLE cdn_arrivals ADD COLUMN IF NOT EXISTS verification_evidence text;
ALTER TABLE cdn_arrivals ADD COLUMN IF NOT EXISTS verification_source text;
ALTER TABLE cdn_arrivals ADD COLUMN IF NOT EXISTS verified_at timestamptz;
