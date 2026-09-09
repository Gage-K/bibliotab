# Database migrations (Drizzle Kit)

Schema is defined in TypeScript under [`../schema/`](../schema) and migrations are
generated + applied with Drizzle Kit. Raw `pg` queries in the repositories are
unchanged — Drizzle is used here **only for schema/migrations**, not as an ORM.

## Commands (run from `server/`)

| Command | What it does |
|---|---|
| `pnpm db:generate` | Diff the schema files against the last snapshot and write a new `NNNN_*.sql` migration. |
| `pnpm db:migrate` | Apply any pending migrations to the DB in `.env` (tracked in `drizzle.__drizzle_migrations`). |
| `pnpm db:baseline` | Mark the **baseline** migration (0000) as already-applied **without running it**, for a DB that already has the schema. Takes `--through <tag>` to stamp further, or `--all`. |
| `pnpm db:studio` | Open Drizzle Studio to browse the DB. |
| `pnpm db:backfill-durations` | One-off: fill in `duration` on every frame (rhythm model). Takes `--dry-run`. |

DB connection comes from `DB_*` in `server/.env` (`drizzle.config.ts` reads
`process.env` directly). Override the target with e.g. `DB_NAME=other pnpm db:migrate`.

## Setting up a database

**A brand-new / empty database** (no tables yet):

```bash
pnpm db:migrate      # creates everything from the migrations
```

**An existing database** that already has the schema — your current dev and prod DBs,
created by [`../../../db/init.sql`](../../../db/init.sql) — must be baselined **once** so
`db:migrate` doesn't try to re-create existing tables:

```bash
pnpm db:baseline     # stamp 0000 as applied
pnpm db:migrate      # applies 0001+ for real
```

Skipping the baseline step is the usual cause of a silent `db:migrate` failure: with an
empty `drizzle.__drizzle_migrations` table, drizzle-kit tries to run `0000` against tables
that already exist, hits `relation "users" already exists`, and exits 1 **without printing
the error**. If `db:migrate` fails with no message, check whether the DB was baselined.

> ⚠️ Only run `db:baseline` on a DB that already has the tables. On an empty DB it would
> mark migrations applied without creating anything — use `db:migrate` there instead.
>
> ⚠️ `db:baseline` deliberately stamps **only 0000**. Stamping a later migration marks it
> applied without running it — for a data migration like `0001` that means the backfill
> never happens and the rows stay in the old shape. Use `--through <tag>` only for
> migrations you know are already reflected in that database.

## Adding a schema change (future phases)

1. Edit the table(s) in [`../schema/`](../schema) (or add a new schema file).
2. `pnpm db:generate` → review the generated SQL. For data backfills (e.g. reshaping
   `tab_data` JSONB), hand-edit the generated migration or add a custom one.
3. `pnpm db:migrate` locally; commit the migration + snapshot; deploy runs `db:migrate`.

## Notes

- **Baseline = `0000_good_marrow.sql`**, which mirrors `db/init.sql`. Minor, benign
  differences: `gen_random_uuid()` instead of `uuid_generate_v4()` (no `uuid-ossp`
  extension needed on PG13+), `now()` instead of `CURRENT_TIMESTAMP`, and the
  `update_modified_at` trigger is **not** reproduced (the repository sets `modified_at`
  itself). Existing DBs keep their trigger; it's harmless.
- **`0001_wrap_tab_data_in_sections.sql` is hand-written and data-only** (Phase 2). The
  `tab_data` column is JSONB either way, so `db:generate` produces no DDL for the section
  wrapper — the backfill was added by hand and `meta/0001_snapshot.json` is a copy of
  0000's with a fresh id so future `db:generate` runs still diff correctly. It only
  touches rows where `jsonb_typeof(tab_data) = 'array'`, so re-running it is a no-op.
  The server also normalizes legacy bodies on read and write (`normalizeTabBody` in
  `shared/utils/tab.serializer.ts`), so an un-migrated row still renders.
- **`0002_wrap_tab_data_in_tracks.sql` is likewise hand-written and data-only.** It
  wraps the sectioned body and the row's `tuning` column into `tracks[0]`. It writes no
  `octaves`: deriving them in SQL would duplicate the instrument-preset table in a
  second language and persist a wrong guess, so the read path fills them in from
  `octavesForTuning` instead and they are saved on the next write. The `tuning` column
  is left in place — no longer read, still NOT NULL, written as a mirror of track 0.
  Dropping it is a follow-up migration.
- **`0003_add_tempo_and_time_signature.sql` is generated** (real DDL: two columns).
  Frame durations are per-frame and live in the blob, so they are backfilled by
  `pnpm db:backfill-durations` rather than by SQL — walking
  `tracks[].body.sections[].measures[][]` is four levels deep and far clearer in
  application code. Run it once after `db:migrate`; it skips rows that already have
  durations, so it is safe to re-run, and `--dry-run` reports without writing.
- `db/init.sql` still bootstraps a fresh Postgres container (mounted in
  `docker-compose.yml`). It and the baseline migration describe the same schema; a fresh
  Docker DB is initialized by `init.sql` and then just needs `db:baseline`.
- The pre-Drizzle hand-written migration is archived at
  [`../../../db/legacy/001_update_tab_schema.sql`](../../../db/legacy/001_update_tab_schema.sql)
  (already reflected in the baseline).
