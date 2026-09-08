-- Migration: Update tab storage to use JSONB and rename columns
-- Date: 2026-02-08
-- Description:
--   1. Rename 'tab' column to 'tab_data' for clarity
--   2. Change tuning and tab_data from TEXT to JSONB for better performance and validation

-- Step 1: Add new JSONB columns
ALTER TABLE tabs
  ADD COLUMN tab_data_new JSONB,
  ADD COLUMN tuning_new JSONB;

-- Step 2: Migrate existing data (convert TEXT to JSONB)
-- Assuming existing 'tab' column contains JSON strings
UPDATE tabs
SET
  tab_data_new = tab::jsonb,
  tuning_new = tuning::jsonb;

-- Step 3: Make new columns NOT NULL (after data migration)
ALTER TABLE tabs
  ALTER COLUMN tab_data_new SET NOT NULL,
  ALTER COLUMN tuning_new SET NOT NULL;

-- Step 4: Drop old columns
ALTER TABLE tabs
  DROP COLUMN tab,
  DROP COLUMN tuning;

-- Step 5: Rename new columns
ALTER TABLE tabs
  RENAME COLUMN tab_data_new TO tab_data;

ALTER TABLE tabs
  RENAME COLUMN tuning_new TO tuning;

-- Optional: Add indexes for JSONB columns if needed for future queries
-- CREATE INDEX idx_tabs_tuning ON tabs USING gin(tuning);

-- Rollback script (save separately if needed):
-- ALTER TABLE tabs RENAME COLUMN tab_data TO tab;
-- ALTER TABLE tabs ALTER COLUMN tab TYPE TEXT USING tab::text;
-- ALTER TABLE tabs ALTER COLUMN tuning TYPE TEXT USING tuning::text;
