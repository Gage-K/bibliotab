import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  // Database
  DB_HOST: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(5432),

  // Authentication
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),

  // Server
  PORT: z.coerce.number().int().positive().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Frontend
  FE_API: z.string().url(),
})

function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formatted = error.issues.map(
        (err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`
      ).join("\n");
      console.error("Environment validation failed:\n" + formatted);
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnv();
