-- Merchandise trade is now displayed through the provider's public embeds.
-- Retire only the custom trade dataset and its scheduler configuration.
DROP TABLE IF EXISTS vietnam_trade_months;
DROP TABLE IF EXISTS vietnam_trade_releases;
DROP TABLE IF EXISTS vietnam_trade_sync_config;
