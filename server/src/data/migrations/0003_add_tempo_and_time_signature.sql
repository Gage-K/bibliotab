-- Phase 5 (rhythm): tab-level tempo and meter.
--
-- These are columns rather than fields inside the tab_data blob: they are tab-level,
-- queryable, and small, and keeping them out of the blob means the serializer can read
-- them without walking the tracks. Frame durations, which are per-frame, stay in the
-- blob and are backfilled by scripts/backfill-frame-durations.mjs.
ALTER TABLE "tabs" ADD COLUMN "bpm" integer DEFAULT 90 NOT NULL;--> statement-breakpoint
ALTER TABLE "tabs" ADD COLUMN "time_signature" jsonb DEFAULT '[4,4]'::jsonb NOT NULL;
