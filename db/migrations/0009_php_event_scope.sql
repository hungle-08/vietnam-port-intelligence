ALTER TABLE vessel_plan_events ADD CONSTRAINT php_event_storage_scope CHECK (
 (movement='arrival' AND to_terminal IS NOT NULL AND to_terminal IN ('php-tan-vu','php-hoang-dieu','php-chua-ve','php-htit','dvp-dinh-vu'))
 OR
 (movement='departure' AND from_terminal IS NOT NULL AND from_terminal IN ('php-tan-vu','php-hoang-dieu','php-chua-ve','php-htit','dvp-dinh-vu'))
);
