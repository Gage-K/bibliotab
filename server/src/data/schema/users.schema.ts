import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";

/**
 * users — mirrors server/db/init.sql.
 * `username` is UNIQUE NOT NULL; `email` is UNIQUE (nullable). The explicit
 * idx_users_* indexes match the original schema (redundant with the unique
 * constraints, but kept so the baseline reflects the live database).
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }).unique(),
    createdAt: timestamp("created_at").defaultNow(),
    lastLogin: timestamp("last_login"),
  },
  (t) => [
    index("idx_users_username").on(t.username),
    index("idx_users_email").on(t.email),
  ],
);
