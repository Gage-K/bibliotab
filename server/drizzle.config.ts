import { defineConfig } from "drizzle-kit";
import "dotenv/config";

/**
 * Drizzle Kit config for generating and applying migrations.
 *
 * Reads DB creds directly from process.env (not the app's strict env.config) so the
 * CLI works for `generate` even when app-only vars like ACCESS_TOKEN_SECRET are absent.
 */
export default defineConfig({
  schema: "./src/data/schema/*.ts",
  out: "./src/data/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST ?? "localhost",
    user: process.env.DB_USER ?? "postgres",
    database: process.env.DB_NAME ?? "tablab",
    password: process.env.DB_PASSWORD ?? "postgres",
    port: Number(process.env.DB_PORT ?? 5432),
    ssl:
      process.env.NODE_ENV === "production" && process.env.DB_HOST !== "postgres"
        ? { rejectUnauthorized: false }
        : false,
  },
});
