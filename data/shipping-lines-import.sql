BEGIN;
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

INSERT INTO shipping_carriers(id,name,short_name,website,logo_url,payload) SELECT p->>'id',p->>'name',p->>'shortName',p->>'website',p->>'logoUrl',p FROM jsonb_array_elements('[{"id":"msc","name":"Mediterranean Shipping Company","shortName":"MSC","sourceNames":["Mediterranean Shg Co","MSC"],"website":"https://www.msc.com","logoUrl":"https://commons.wikimedia.org/wiki/Special:FilePath/Mediterranean_Shipping_Company_logo.svg","logoSourceUrl":"https://commons.wikimedia.org/wiki/File:Mediterranean_Shipping_Company_logo.svg","color":"#b88b26"},{"id":"maersk","name":"Maersk","shortName":"Maersk","sourceNames":["Maersk"],"website":"https://www.maersk.com","logoUrl":"https://commons.wikimedia.org/wiki/Special:FilePath/Maersk_Group_Logo.svg","logoSourceUrl":"https://commons.wikimedia.org/wiki/File:Maersk_Group_Logo.svg","color":"#42b0d5"},{"id":"cma-cgm","name":"CMA CGM Group","shortName":"CMA CGM","sourceNames":["CMA CGM Group"],"website":"https://www.cma-cgm.com","logoUrl":"https://www.cma-cgm.com/assets/public/images/201706-newlogo-cp.png","logoSourceUrl":"https://www.cma-cgm.com/news/1668/shipping-the-future-cma-cgm-unveils-its-new-ambition","color":"#123c72"},{"id":"cosco","name":"COSCO Shipping Group","shortName":"COSCO","sourceNames":["COSCO Group"],"website":"https://lines.coscoshipping.com","logoUrl":"https://commons.wikimedia.org/wiki/Special:FilePath/COSCO_Shipping_Logo.svg","logoSourceUrl":"https://commons.wikimedia.org/wiki/File:COSCO_Shipping_Logo.svg","color":"#225d9e"},{"id":"hapag-lloyd","name":"Hapag-Lloyd","shortName":"Hapag-Lloyd","sourceNames":["Hapag-Lloyd"],"website":"https://www.hapag-lloyd.com","logoUrl":"https://www.hapag-lloyd.com/content/dam/website/downloads/press_and_media/download_logo_HLAG.png","logoSourceUrl":"https://www.hapag-lloyd.com/en/company/press/photos-videos/hapag-lloyd-logo.html","color":"#ec6e24"},{"id":"one","name":"Ocean Network Express","shortName":"ONE","sourceNames":["ONE (Ocean Network Express)"],"website":"https://www.one-line.com","logoUrl":"https://commons.wikimedia.org/wiki/Special:FilePath/Ocean_Network_Express_logo.svg","logoSourceUrl":"https://commons.wikimedia.org/wiki/File:Ocean_Network_Express_logo.svg","color":"#b3297c"},{"id":"evergreen","name":"Evergreen Line","shortName":"Evergreen","sourceNames":["Evergreen Line"],"website":"https://www.evergreen-marine.com","logoUrl":"https://commons.wikimedia.org/wiki/Special:FilePath/Evergreen_Logo.svg","logoSourceUrl":"https://commons.wikimedia.org/wiki/File:Evergreen_Logo.svg","color":"#258653"},{"id":"hmm","name":"HMM","shortName":"HMM","sourceNames":["HMM Co Ltd"],"website":"https://www.hmm21.com","logoUrl":"https://www.hmm21.com/images/company/company/brand/Full%20Color_Positive.png","logoSourceUrl":"https://www.hmm21.com/company/ci.do","color":"#19417d"},{"id":"yang-ming","name":"Yang Ming Marine Transport","shortName":"Yang Ming","sourceNames":["Yang Ming Marine Transport Corp."],"website":"https://www.yangming.com","logoUrl":"https://companieslogo.com/img/orig/2609.TW_BIG-945d69e9.png","logoSourceUrl":"https://companieslogo.com/yang-ming/logo/","color":"#d44b51"},{"id":"zim","name":"ZIM Integrated Shipping Services","shortName":"ZIM","sourceNames":["Zim","ZIM"],"website":"https://www.zim.com","logoUrl":"https://www.zim.com/assets/uzzfnajh/logo_zim_2026_313x112-dark.png","logoSourceUrl":"https://www.zim.com/about-zim","color":"#317f99"}]'::jsonb) p ON CONFLICT(id) DO UPDATE SET name=excluded.name,short_name=excluded.short_name,website=excluded.website,logo_url=excluded.logo_url,payload=excluded.payload;
INSERT INTO shipping_fleet_snapshots(id,source_id,as_of,retrieved_at,source_url,metric,scope,content_hash,metadata) VALUES('alphaliner:2026-10-12:a462654a7f88133c','alphaliner','2026-10-12','2026-10-13T03:53:00.691Z','https://alphaliner.axsmarine.com/PublicTop100/','operated-container-capacity-teu','consolidated','a462654a7f88133c823eb8c823769b386e7ff3c139b6f01a86396b169fb0cebf','{"sourceId":"alphaliner","asOf":"2026-10-12","metric":"operated-container-capacity-teu","scope":"consolidated","sourceUrl":"https://alphaliner.axsmarine.com/PublicTop100/","retrievedAt":"2026-10-13T03:53:00.691Z","retrievalMethod":"web-search-index"}'::jsonb) ON CONFLICT(id) DO NOTHING;
INSERT INTO shipping_fleet_rankings(snapshot_id,carrier_id,rank,source_name,capacity_teu,ship_count,share_percent) SELECT 'alphaliner:2026-10-12:a462654a7f88133c',p->>'carrierId',(p->>'rank')::integer,p->>'sourceName',(p->>'capacityTeu')::bigint,(p->>'shipCount')::integer,(p->>'sharePercent')::numeric FROM jsonb_array_elements('[{"rank":1,"carrierId":"msc","sourceName":"Mediterranean Shg Co","capacityTeu":7452694,"sharePercent":21.5,"shipCount":1016},{"rank":2,"carrierId":"maersk","sourceName":"Maersk","capacityTeu":4728084,"sharePercent":13.7,"shipCount":750},{"rank":3,"carrierId":"cma-cgm","sourceName":"CMA CGM Group","capacityTeu":4471328,"sharePercent":12.9,"shipCount":729},{"rank":4,"carrierId":"cosco","sourceName":"COSCO Group","capacityTeu":3656295,"sharePercent":10.6,"shipCount":565},{"rank":5,"carrierId":"hapag-lloyd","sourceName":"Hapag-Lloyd","capacityTeu":2410123,"sharePercent":7,"shipCount":289},{"rank":6,"carrierId":"one","sourceName":"ONE (Ocean Network Express)","capacityTeu":2191058,"sharePercent":6.3,"shipCount":271},{"rank":7,"carrierId":"evergreen","sourceName":"Evergreen Line","capacityTeu":2040081,"sharePercent":5.9,"shipCount":243},{"rank":8,"carrierId":"hmm","sourceName":"HMM Co Ltd","capacityTeu":1034348,"sharePercent":3,"shipCount":97},{"rank":9,"carrierId":"yang-ming","sourceName":"Yang Ming Marine Transport Corp.","capacityTeu":771280,"sharePercent":2.2,"shipCount":99},{"rank":10,"carrierId":"zim","sourceName":"Zim","capacityTeu":691560,"sharePercent":2,"shipCount":113}]'::jsonb) p ON CONFLICT(snapshot_id,carrier_id) DO NOTHING;
INSERT INTO schema_migrations(id,checksum) VALUES('0003_shipping_lines.sql','78bfaa88f2a30ed9d3167f695b701f3fb710cde9e0f94cb9dad857d4af4e85d9') ON CONFLICT(id) DO NOTHING;
COMMIT;
