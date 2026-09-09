/**
 * Baseline-stamp an EXISTING database.
 *
 * Marks the baseline migration as already-applied WITHOUT running its SQL, by recording
 * its hash in drizzle.__drizzle_migrations. Run this ONCE against a database that
 * already has the schema (e.g. one created by server/db/init.sql) so that
 * `pnpm db:migrate` skips 0000 and applies only the migrations after it.
 *
 * By default ONLY the first journal entry (0000, the schema baseline) is stamped —
 * later migrations are real changes that must actually run. Stamping them would skip
 * them silently, which for a data migration means the backfill never happens.
 *
 * DO NOT run this on an empty database — it would mark migrations applied without
 * creating any tables. Empty DBs should use `pnpm db:migrate` instead.
 *
 * Usage:
 *   pnpm db:baseline                          # stamp 0000 only (uses DB_* from .env)
 *   pnpm db:baseline --through 0002_some_tag  # stamp 0000..0002 (already-applied ones)
 *   pnpm db:baseline --all                    # stamp every migration in the journal
 *   DB_NAME=other pnpm db:baseline            # override target database
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import "dotenv/config";
import pg from "pg";

const MIGRATIONS_DIR = path.resolve("src/data/migrations");
const journal = JSON.parse(
  readFileSync(path.join(MIGRATIONS_DIR, "meta/_journal.json"), "utf8"),
);

const args = process.argv.slice(2);
const throughIndex = args.indexOf("--through");
const through = throughIndex === -1 ? null : args[throughIndex + 1];

let entries;
if (args.includes("--all")) {
  entries = journal.entries;
} else if (through) {
  const cutoff = journal.entries.findIndex((entry) => entry.tag === through);
  if (cutoff === -1) {
    console.error(`No migration tagged "${through}" in the journal.`);
    process.exit(1);
  }
  entries = journal.entries.slice(0, cutoff + 1);
} else {
  entries = journal.entries.slice(0, 1);
}

const skipped = journal.entries.length - entries.length;

const pool = new pg.Pool({
  host: process.env.DB_HOST ?? "localhost",
  user: process.env.DB_USER ?? "postgres",
  database: process.env.DB_NAME ?? "tablab",
  password: process.env.DB_PASSWORD ?? "postgres",
  port: Number(process.env.DB_PORT ?? 5432),
});

const client = await pool.connect();
try {
  await client.query("CREATE SCHEMA IF NOT EXISTS drizzle");
  await client.query(`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
  )`);

  for (const entry of entries) {
    const sql = readFileSync(
      path.join(MIGRATIONS_DIR, `${entry.tag}.sql`),
      "utf8",
    );
    const hash = createHash("sha256").update(sql).digest("hex");

    const { rows } = await client.query(
      "SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = $1",
      [hash],
    );
    if (rows.length) {
      console.log(`already stamped: ${entry.tag}`);
      continue;
    }

    await client.query(
      "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)",
      [hash, entry.when],
    );
    console.log(`stamped: ${entry.tag}`);
  }
  console.log("Baseline stamp complete.");
  if (skipped > 0) {
    console.log(
      `${skipped} later migration(s) left unstamped — run \`pnpm db:migrate\` to apply them.`,
    );
  }
} finally {
  client.release();
  await pool.end();
}
