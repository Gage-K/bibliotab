-- Drop the lyric-mapper column. The Tiptap lyric editor (added in 0005) was removed;
-- notes cover freeform text and the column is no longer written or read.
ALTER TABLE "tabs" DROP COLUMN "lyrics";