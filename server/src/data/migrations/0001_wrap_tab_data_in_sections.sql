-- Phase 2 (sections): wrap legacy flat `tab_data` arrays into
-- { sections: [{ id, name, measures }] }.
--
-- Data-only migration; the tabs.tab_data column stays JSONB, so drizzle-kit generates
-- no DDL for it — this file is hand-written and its snapshot is a copy of 0000's.
-- Only touches rows still in the old shape, so it is safe to re-run.
UPDATE tabs
SET tab_data = jsonb_build_object(
  'sections',
  jsonb_build_array(
    jsonb_build_object(
      'id', gen_random_uuid()::text,
      'name', 'Section 1',
      'measures', tab_data
    )
  )
)
WHERE jsonb_typeof(tab_data) = 'array';
