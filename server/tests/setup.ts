/**
 * Test environment. `env.config.ts` validates process.env at import time and calls
 * process.exit(1) on failure, so every required variable must be present before the
 * first import — a setup file is the only place early enough.
 *
 * These are assigned unconditionally so a developer's real `.env` (loaded by
 * dotenv/config) can never leak into assertions.
 */
export const TEST_ACCESS_TOKEN_SECRET = "test-access-secret-0000000000000000";
export const TEST_REFRESH_TOKEN_SECRET = "test-refresh-secret-000000000000000";

process.env.NODE_ENV = "test";
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";
process.env.DB_USER = "test";
process.env.DB_PASSWORD = "test";
process.env.DB_NAME = "test";
process.env.ACCESS_TOKEN_SECRET = TEST_ACCESS_TOKEN_SECRET;
process.env.REFRESH_TOKEN_SECRET = TEST_REFRESH_TOKEN_SECRET;
process.env.PORT = "3000";
process.env.FE_API = "http://localhost:5173";
