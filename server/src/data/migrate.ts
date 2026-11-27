/**
 * Applies pending Drizzle migrations at runtime, without drizzle-kit.
 *
 * drizzle-kit is a devDependency and is not in the production image, so production uses
 * drizzle-orm's own migrator instead. It reads the same `migrations/` folder and records
 * progress in the same `drizzle.__drizzle_migrations` table as `pnpm db:migrate`, so the
 * two are interchangeable.
 *
 * Runs in two places:
 *   - `app.ts`, before the server listens. The server never serves against a schema
 *     older than its code; if migrating fails, the process exits instead of listening.
 *   - `node dist/server/src/data/migrate.js`, the deploy's one-off step, which runs
 *     before the running container is replaced (see .github/workflows/deploy.yml).
 *
 * It never baselines. A database that already has tables but no migration history (one
 * created by db/init.sql) is refused with an error that says to run `pnpm db:baseline`
 * by hand, rather than letting 0000 try to re-create tables that exist.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { Client, type ClientConfig } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { dbConfig } from "./db.config";

export const MIGRATIONS_FOLDER = path.resolve(__dirname, "migrations");

/** Arbitrary constant: serializes concurrent migrators on one database. */
const MIGRATION_LOCK_ID = 727_271_001;

/** Tables that mean "this database already has the app's schema". */
const APP_TABLES = ["users", "passwords", "tabs"] as const;

export interface JournalEntry {
  tag: string;
  when: number;
}

export type MigrationPlan =
  | { kind: "up-to-date"; latest: string | null }
  | { kind: "pending"; tags: string[] }
  | { kind: "not-baselined"; existingTables: string[] };

/**
 * Decides what a migrate run would do. Mirrors drizzle's own rule: a migration is
 * pending when its journal timestamp is later than the newest applied one.
 *
 * @param lastAppliedAt `created_at` of the newest row in __drizzle_migrations, or null
 *   when there are none.
 * @param existingTables app tables already present in the `public` schema.
 */
export function planMigrations(
  journal: JournalEntry[],
  lastAppliedAt: number | null,
  existingTables: string[],
): MigrationPlan {
  if (lastAppliedAt === null && existingTables.length > 0) {
    return { kind: "not-baselined", existingTables };
  }
  const pending = journal.filter(
    (entry) => lastAppliedAt === null || lastAppliedAt < entry.when,
  );
  if (pending.length === 0) {
    const applied = journal.filter((entry) => entry.when <= (lastAppliedAt ?? -1));
    return { kind: "up-to-date", latest: applied[applied.length - 1]?.tag ?? null };
  }
  return { kind: "pending", tags: pending.map((entry) => entry.tag) };
}

export class NotBaselinedError extends Error {
  constructor(existingTables: string[]) {
    super(
      `Refusing to migrate: the database already has tables (${existingTables.join(", ")}) ` +
        "but no Drizzle migration history (drizzle.__drizzle_migrations is empty or missing). " +
        "Running migration 0000 would try to re-create them. Baseline it once by hand " +
        "(`pnpm db:baseline`, see server/src/data/migrations/README.md), then redeploy.",
    );
    this.name = "NotBaselinedError";
  }
}

function readJournal(migrationsFolder: string): JournalEntry[] {
  const raw = readFileSync(path.join(migrationsFolder, "meta/_journal.json"), "utf8");
  return (JSON.parse(raw) as { entries: JournalEntry[] }).entries;
}

async function lastAppliedAt(client: Client): Promise<number | null> {
  const { rows: exists } = await client.query<{ present: boolean }>(
    "SELECT to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS present",
  );
  if (!exists[0].present) return null;
  const { rows } = await client.query<{ created_at: string | null }>(
    "SELECT max(created_at) AS created_at FROM drizzle.__drizzle_migrations",
  );
  return rows[0].created_at === null ? null : Number(rows[0].created_at);
}

async function existingAppTables(client: Client): Promise<string[]> {
  const { rows } = await client.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ANY($1::text[])
      ORDER BY table_name`,
    [APP_TABLES],
  );
  return rows.map((row) => row.table_name);
}

/**
 * Brings the database up to the newest migration in `migrationsFolder`. A no-op when it
 * is already there. Throws (and applies nothing) if any migration fails: drizzle runs
 * all pending migrations in a single transaction.
 */
export async function runMigrations(
  connection: ClientConfig,
  {
    migrationsFolder = MIGRATIONS_FOLDER,
    log = (message: string) => console.log(`[migrate] ${message}`),
  }: { migrationsFolder?: string; log?: (message: string) => void } = {},
): Promise<MigrationPlan> {
  const journal = readJournal(migrationsFolder);
  const client = new Client(connection);
  await client.connect();
  try {
    // One connection throughout, so the session-level lock covers the migrate call.
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);

    const plan = planMigrations(
      journal,
      await lastAppliedAt(client),
      await existingAppTables(client),
    );

    if (plan.kind === "not-baselined") throw new NotBaselinedError(plan.existingTables);
    if (plan.kind === "up-to-date") {
      log(`Database is up to date (latest: ${plan.latest ?? "none"}).`);
      return plan;
    }

    log(`Applying ${plan.tags.length} migration(s): ${plan.tags.join(", ")}`);
    await migrate(drizzle(client), { migrationsFolder });
    log("Migrations applied.");
    return plan;
  } finally {
    await client.end();
  }
}

// `node dist/server/src/data/migrate.js`: the deploy's migrate step.
if (require.main === module) {
  runMigrations(dbConfig).then(
    () => process.exit(0),
    (error: unknown) => {
      console.error("[migrate] Migration failed:", error);
      process.exit(1);
    },
  );
}
