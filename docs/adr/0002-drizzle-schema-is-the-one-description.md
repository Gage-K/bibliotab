# The Drizzle schema files are the one description of the database

Status: proposed

The server describes its database twice, and nothing checks one against the other. The Drizzle schema files (`server/src/data/schema/*.ts`) exist only so `drizzle-kit generate` can write migrations; at runtime Drizzle only applies them (`server/src/data/migrate.ts`). The repositories (`server/src/data/repositories/*.ts`) query Postgres in hand-written SQL through `pg`, and their rows are typed by hand: `TabEntity` and the Tab DTOs in `shared/types/tab.types.ts`, `User` in `server/src/core/types/user.types.ts`. Every recent column change to a Tab (tempo and meter, notes, lyrics added and then dropped) edited the schema file, the migration, the repository and the shared types together, kept in step by hand. They already disagree: the schema has `tab_artist`, `created_at` and `modified_at` nullable, and `TabEntity` says they never are; `users.email` is nullable, and `User.email` is a plain string. A migration that renamed or dropped a column the repositories still use would compile and pass every test, because the service tests mock the repositories and nothing runs them against a real database. It would fail only when production ran the query.

We will move the repositories onto Drizzle's query builder over the existing schema files, and type rows from the schema (`typeof tabs.$inferSelect` and `$inferInsert`) instead of by hand. The schema files become the one description: migrations are generated from them, and the compiler checks queries against them. A CI step runs `drizzle-kit generate` and fails if it writes a file, so the schema files and the committed migrations can't drift apart either. Today it reports no changes.

This moves drift detection into the type-checker. It needs no database, runs on every build, and covers every query, including ones nobody wrote a test for. It costs little. A throwaway spike rewrote `TabRepository` on Drizzle in about 70 lines, and it type-checks against the current schema. Its first compile flagged the three nullable Tab columns above. Drizzle is already a production dependency (for the migrator), so the image ships nothing new.

## Considered options

- **Move the repositories onto Drizzle's query builder** (chosen).
  - *What changes:* the 17 methods across the two repositories, and where the row types come from. The schema's property names are camelCase (`tabName`), while `TabEntity`, the DTOs and the serializer use the column names (`tab_name`). Renaming the properties to the column names produces no migration (`drizzle-kit generate` reports no changes) and leaves the serializer untouched. The other way is to map rows in the repository.
  - *Effort:* about a day, including fixing the nullability mismatches the compiler turns up.
  - *Risk:* small behaviour changes in the rewritten queries. `create` currently fills `bpm`, `time_signature` and `notes` with `COALESCE`. Drizzle instead leaves out undefined values so the column defaults apply. JSONB values are serialized by Drizzle instead of by explicit `JSON.stringify`. Data migrations stay hand-written (`drizzle-kit generate --custom`), as 0001 and 0002 were.
  - *Drift it prevents:* a query naming a column the schema doesn't have, and a row type that disagrees with a column's type or nullability. With the generate check, it also prevents schema files that disagree with the migrations.
- **Keep raw SQL, drop the schema files, and hand-write SQL migrations.** The migrator and `drizzle.__drizzle_migrations` stay.
  - *What changes:* delete `schema/`, `drizzle.config.ts`, drizzle-kit and the snapshots. Each migration is written by hand along with its `meta/_journal.json` entry, which drizzle-orm's migrator still reads. Alternatively, replace `migrate.ts` with a small runner that keeps the same tracking table.
  - *Effort:* a few hours.
  - *Risk:* low at first. Over time the journal is maintained by hand and `generate` no longer diffs anything.
  - *Drift it prevents:* only schema files disagreeing with the migrations, by removing them. Rejected because it removes the one description that could be checked and keeps the gap that matters: repository SQL and hand-written row types still checked against nothing.
- **Keep both and add a test that they agree.**
  - *What changes:* an integration test applies every migration to a scratch Postgres (`runMigrations` already takes any connection), calls every repository method, and asserts that rows come back with `TabEntity`'s keys. CI needs a Postgres service, and no CI test job exists today.
  - *Effort:* half a day plus the CI Postgres. A spike of it was about 40 lines, ran in under a second, and failed once an INSERT named a dropped column.
  - *Risk:* none to runtime code.
  - *Drift it prevents:* missing columns, but only in the methods the test remembers to call. It can't see nullability unless each column is asserted by hand, and every schema change still edits four files. Rejected as the fix.

## Consequences

- `TabEntity` is used only by the server and by the entity half of `shared/utils/tab.serializer.ts`; the client doesn't import it. Either derive it from the schema in the server, or keep it in `shared/` and pin it with a compile-time assertion that it equals `typeof tabs.$inferSelect`. Decide when implementing.
- Fixing the mismatches is part of the work. Either make `tab_artist`, `created_at`, `modified_at` and the user columns `NOT NULL` with a migration, or let the row types admit null and handle it in the serializer.
- Type-checking doesn't cover what a data migration does to the `tab_data` JSONB (0001, 0002). If those keep coming, the migrations-into-a-scratch-database test from the third option is still worth adding as a migration smoke test, without the per-repository assertions.
- `server/scripts/*.mjs` (the backfill, seed and baseline scripts) stay raw SQL. They are one-off and stay unchecked.
- `server/db/init.sql` still describes the 0000 baseline for fresh Docker databases. Retiring it in favour of letting the migrator build an empty database is a separate decision.
- `server/src/data/migrations/README.md` says Drizzle is "only for schema/migrations, not as an ORM"; update it with the change.
