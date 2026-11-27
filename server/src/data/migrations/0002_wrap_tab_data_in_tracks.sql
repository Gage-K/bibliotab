-- Phase 3b (tracks): wrap the sectioned body plus the row's `tuning` column into
-- { tracks: [{ id, name, instrument, tuning, body }] }.
--
-- Data-only migration; `tab_data` stays JSONB, so drizzle-kit generates no DDL for it
-- and this file is hand-written. Only touches rows still in the Phase 2 shape, so it
-- is safe to re-run.
--
-- `octaves` is deliberately NOT written here. Deriving it in SQL would mean duplicating
-- the preset table and the octave-descent rule in a second language, and a wrong guess
-- would then be persisted. Leaving it out lets `normalizeTrack`
-- (shared/utils/tab.serializer.ts) fill it in on read from `octavesForTuning`, which
-- knows the presets exactly; the value is persisted the next time the tab is saved.
--
-- The `tuning` column is left in place. It is no longer read, but it is NOT NULL and
-- the server keeps it mirroring tracks[0]; dropping it is a follow-up migration.
UPDATE tabs
SET tab_data = jsonb_build_object(
  'tracks',
  jsonb_build_array(
    jsonb_build_object(
      'id', gen_random_uuid()::text,
      'name', 'Track 1',
      'instrument', 'guitar',
      'tuning', tuning,
      'body', tab_data
    )
  )
)
WHERE tab_data ? 'sections';
