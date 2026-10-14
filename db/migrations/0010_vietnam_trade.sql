CREATE TABLE vietnam_trade_releases (
 id text PRIMARY KEY,
 source_year integer NOT NULL CHECK (source_year BETWEEN 2000 AND 2100),
 source_url text NOT NULL,
 exports_url text NOT NULL,
 imports_url text NOT NULL,
 retrieved_at timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'preliminary' CHECK (status='preliminary')
);
CREATE TABLE vietnam_trade_months (
 period date PRIMARY KEY CHECK (extract(day FROM period)=1),
 exports_usd numeric(20,2) NOT NULL CHECK (exports_usd>=0),
 imports_usd numeric(20,2) NOT NULL CHECK (imports_usd>=0),
 release_id text NOT NULL REFERENCES vietnam_trade_releases(id),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE vietnam_trade_sync_config (
 id text PRIMARY KEY CHECK (id='vietnam-merchandise-trade'),
 enabled boolean NOT NULL DEFAULT true,
 interval_days integer NOT NULL DEFAULT 1 CHECK (interval_days BETWEEN 1 AND 30),
 source_url text NOT NULL CHECK (source_url='https://www.nso.gov.vn/xuat-nhap-khau/'),
 next_run_at timestamptz NOT NULL DEFAULT now(),
 revision integer NOT NULL DEFAULT 1,
 lease_token uuid,
 lease_until timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid REFERENCES auth_users(id),
 last_checked_at timestamptz,
 last_result text CHECK (last_result IN ('success','failed')),
 last_message text
);
INSERT INTO vietnam_trade_sync_config(id,source_url) VALUES('vietnam-merchandise-trade','https://www.nso.gov.vn/xuat-nhap-khau/');
