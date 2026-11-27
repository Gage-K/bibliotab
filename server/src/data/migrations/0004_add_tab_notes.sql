-- Phase 6a (notes): freeform markdown notes per tab.
--
-- TEXT rather than JSONB: the field has no structure worth querying. NOT NULL with an
-- empty-string default so existing rows need no backfill and the read path never has
-- to deal with null.
ALTER TABLE "tabs" ADD COLUMN "notes" text DEFAULT '' NOT NULL;
