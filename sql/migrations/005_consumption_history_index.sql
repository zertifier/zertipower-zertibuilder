-- Supports latest reading and date range lookups without scanning all meter history.
CREATE INDEX IF NOT EXISTS energy_hourly_cups_info_dt ON energy_hourly (cups_id, info_dt);
