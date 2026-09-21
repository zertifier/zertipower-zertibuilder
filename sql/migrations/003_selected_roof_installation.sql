-- Apply after 002. Nullable fields preserve existing selected configurations.
ALTER TABLE member_solar_configurations
  ADD COLUMN IF NOT EXISTS energy_area_id INT NULL,
  ADD COLUMN IF NOT EXISTS inverter_power_kw DOUBLE NULL;
