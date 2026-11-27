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

## Migrations run automatically on server start and on deploy

The server applies pending migrations itself; nobody needs to run `db:migrate` against
production. [`../migrate.ts`](../migrate.ts) uses drizzle-orm's runtime migrator (the
prod image has no drizzle-kit), reads this folder, and records progress in the same
`drizzle.__drizzle_migrations` table as `pnpm db:migrate`, so the two are interchangeable.

**On every server start** (`app.ts`, dev and prod), before it listens:

- Database at the latest migration → logs `[migrate] Database is up to date` and starts.
- Migrations pending → logs which, applies them, then starts.
- A migration fails → nothing is applied (drizzle runs all pending migrations in one
  transaction), the error is logged, and the process exits 1 without listening.
- Tables exist but there is no migration history (an un-baselined DB) → refuses with
  `NotBaselinedError` and exits 1. **It never baselines on its own**; see below.

**On deploy** ([`.github/workflows/deploy.yml`](../../../../.github/workflows/deploy.yml)),
on the VPS:

1. `git pull`, then `docker compose -f docker-compose.prod.yml build`.
2. `docker compose ... run --rm backend node dist/server/src/data/migrate.js`: the same
   migrator as a one-off container from the **new** image, while the **old** backend is
   still serving. If it fails, the deploy stops here and goes red with the error in the
   job log under "Database migrations"; the old backend keeps serving an unchanged
   schema. Fix the migration and push again.
3. `docker compose ... up -d` replaces the containers. The new backend's own startup
   migrate is a no-op by now.
4. The job waits up to 60s for the backend to log `Application running`, and otherwise
   prints its last 100 log lines and fails.

Running it in step 2 rather than only on boot is the safer failure: a broken migration is
caught before the working container is torn down, instead of leaving a crash-looping
backend (`restart: always`) and a site that is down until the next push.

Not automatic: `pnpm db:baseline` (by hand, once per existing database) and one-off data
scripts such as `pnpm db:backfill-durations`.

## Setting up a database

**A brand-new / empty database** (no tables yet): just start the server, or

```bash
pnpm db:migrate      # creates everything from the migrations
```

**An existing database** that already has the schema — your current dev and prod DBs,
created by [`../../../db/init.sql`](../../../db/init.sql) — must be baselined **once** so
`db:migrate` doesn't try to re-create existing tables. Until it is, the server refuses to
start (and a deploy fails at its migrate step) with `NotBaselinedError`:

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

### Production: one-time stamp after the hand-applied 0001–0006

Prod's schema came from `init.sql`, and for PR #16 its migrations 0001–0006 are applied by
hand with `psql --single-transaction`, not through Drizzle. Prod therefore has the
current schema but no `drizzle.__drizzle_migrations` table, and every deploy will fail at
its migrate step with `NotBaselinedError` (the old backend keeps serving) until it is
stamped once. From a laptop checkout of the commit that is deployed:

```bash
# Terminal 1: tunnel to prod Postgres (bound to 127.0.0.1:5432 on the VPS)
ssh -N -L 5433:127.0.0.1:5432 deploy@<SERVER_IP>
```

```bash
# Terminal 2, in server/: record 0000–0006 as applied, without running them
DB_HOST=localhost DB_PORT=5433 DB_USER=<prod user> DB_PASSWORD=<prod password> DB_NAME=<prod db> pnpm db:baseline --through 0006_drop_tab_lyrics
```

It should print `stamped:` for 0000 through 0006. Then re-run the Deploy workflow; its
migrate step should log `Database is up to date (latest: 0006_drop_tab_lyrics)`.

- Use `--through 0006_drop_tab_lyrics`, **not** `--all`. `--all` stamps everything in
  the laptop's journal, so a checkout that has a newer, unapplied migration would mark it
  done without running it.
- Plain `pnpm db:baseline` (0000 only) would be wrong here, but it fails safely: the
  next deploy re-runs 0003, stops on `column "bpm" of relation "tabs" already exists`,
  and rolls back. Fix that by running the `--through` command above; it skips 0000,
  which is already stamped.

## Adding a schema change (future phases)

1. Edit the table(s) in [`../schema/`](../schema) (or add a new schema file).
2. `pnpm db:generate` → review the generated SQL. For data backfills (e.g. reshaping
   `tab_data` JSONB), hand-edit the generated migration or add a custom one.
3. `pnpm db:migrate` locally (or restart the dev server); commit the migration +
   snapshot. Merging to `main` deploys, and the deploy applies it (see above). Keep
   migrations safe for the **old** code too: the old backend serves for a short while
   after step 2 of the deploy, and keeps serving if a later step fails.

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
- **`0004_add_tab_notes.sql` and `0005_add_tab_lyrics.sql` are generated.** Both add a
  single column with a safe default (empty string, and null respectively), so neither
  needs a backfill.
- **`0006_drop_tab_lyrics.sql` is generated.** The Tiptap lyric mapper was removed, so
  the `lyrics` column added in 0005 is dropped. Freeform text lives in `notes`. The drop
  is destructive by design — the feature is gone — and `init.sql` no longer defines the
  column either.
- `db/init.sql` still bootstraps a fresh Postgres container (mounted in
  `docker-compose.yml` and `docker-compose.prod.yml`). It and the baseline migration
  describe the same schema; a fresh Docker DB is initialized by `init.sql` and then needs
  `db:baseline` before the backend will start.
- The pre-Drizzle hand-written migration is archived at
  [`../../../db/legacy/001_update_tab_schema.sql`](../../../db/legacy/001_update_tab_schema.sql)
  (already reflected in the baseline).
- **Drizzle at runtime is limited to `../migrate.ts`.** The app itself uses a plain `pg`
  Pool and raw SQL. The migrator relies on drizzle-orm's migrator, the
  `meta/_journal.json` format and the `drizzle.__drizzle_migrations` table. Dropping
  Drizzle means replacing that one file with a runner that keeps the same
  "refuse when untracked, apply pending in one transaction" behaviour.
