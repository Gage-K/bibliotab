# Database migrations (Drizzle Kit)

Schema is defined in TypeScript under [`../schema/`](../schema) and migrations are
generated + applied with Drizzle Kit. Raw `pg` queries in the repositories are
unchanged — Drizzle is used here **only for schema/migrations**, not as an ORM.

## Commands (run from `server/`)

| Command | What it does |
|---|---|
| `pnpm db:generate` | Diff the schema files against the last snapshot and write a new `NNNN_*.sql` migration. |
| `pnpm db:migrate` | Apply any pending migrations to the DB in `.env` (tracked in `drizzle.__drizzle_migrations`). |
| `pnpm db:baseline` | Mark existing migrations as already-applied **without running them** (for a DB that already has the schema). |
| `pnpm db:studio` | Open Drizzle Studio to browse the DB. |

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
pnpm db:migrate      # now a no-op; applies only NEW migrations going forward
```

> ⚠️ Only run `db:baseline` on a DB that already has the tables. On an empty DB it would
> mark migrations applied without creating anything — use `db:migrate` there instead.

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
- `db/init.sql` still bootstraps a fresh Postgres container (mounted in
  `docker-compose.yml`). It and the baseline migration describe the same schema; a fresh
  Docker DB is initialized by `init.sql` and then just needs `db:baseline`.
- The pre-Drizzle hand-written migration is archived at
  [`../../../db/legacy/001_update_tab_schema.sql`](../../../db/legacy/001_update_tab_schema.sql)
  (already reflected in the baseline).
