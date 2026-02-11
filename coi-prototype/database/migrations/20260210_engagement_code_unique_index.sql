-- Explicit unique index on engagement_code for clarity (schema already has UNIQUE on column).
-- Idempotent; no-op where constraint already exists.
CREATE UNIQUE INDEX IF NOT EXISTS idx_coi_engagement_codes_engagement_code ON coi_engagement_codes(engagement_code);
