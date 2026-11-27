-- Phase 6b (lyrics): Tiptap lyric document per tab.
--
-- JSONB because the document is structured — syllable-to-frame bindings are stored as
-- marks inside it. Nullable rather than defaulting to an empty doc, so a tab that has
-- never had lyrics is distinguishable from one deliberately cleared.
--
-- The bindings reference frames by their nanoid, never by index: measures move between
-- sections and frames are inserted and deleted, but ids are stable.
ALTER TABLE "tabs" ADD COLUMN "lyrics" jsonb;
