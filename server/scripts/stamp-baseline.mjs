/**
 * Baseline-stamp an EXISTING database.
 *
 * Marks all current Drizzle migrations as already-applied WITHOUT running their SQL,
 * by recording each one's hash in drizzle.__drizzle_migrations. Run this ONCE against a
 * database that already has the schema (e.g. one created by server/db/init.sql) so that
 * future `pnpm db:migrate` runs apply only NEW migrations (0001+).
 *
 * DO NOT run this on an empty database — it would mark migrations applied without
 * creating any tables. Empty DBs should use `pnpm db:migrate` instead.
 *
 * Usage:
 *   pnpm db:baseline                 # uses DB_* from .env
 *   DB_NAME=other pnpm db:baseline   # override target database
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

  for (const entry of journal.entries) {
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
} finally {
  client.release();
  await pool.end();
}
