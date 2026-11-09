CREATE TABLE youtube_live_videos (
 video_id text PRIMARY KEY,
 channel_id text NOT NULL,
 title text NOT NULL,
 published_at timestamptz NOT NULL,
 detected_at timestamptz NOT NULL DEFAULT now(),
 last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX youtube_live_videos_published_idx ON youtube_live_videos(published_at DESC);
CREATE TABLE youtube_live_checks (
 id bigserial PRIMARY KEY,
 checked_at timestamptz NOT NULL DEFAULT now(),
 status text NOT NULL CHECK(status IN ('found','none','error')),
 found_count integer NOT NULL DEFAULT 0
);
