import type { PoolConfig } from "pg";
import { env } from "../common/config/env.config";

/** Connection settings shared by the app's pool and the migrator. */
export const dbConfig: PoolConfig = {
  host: env.DB_HOST,
  user: env.DB_USER,
  database: env.DB_NAME,
  password: env.DB_PASSWORD,
  port: env.DB_PORT,
  ssl: env.NODE_ENV === "production" && env.DB_HOST !== "postgres" ? { rejectUnauthorized: false } : false,
};
