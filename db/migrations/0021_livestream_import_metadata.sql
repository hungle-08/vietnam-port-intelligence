ALTER TABLE youtube_live_videos ADD COLUMN IF NOT EXISTS channel_verified boolean NOT NULL DEFAULT true;
ALTER TABLE youtube_live_videos ADD COLUMN IF NOT EXISTS start_time_known boolean NOT NULL DEFAULT true;
