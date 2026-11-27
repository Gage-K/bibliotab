import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users.schema";

/**
 * passwords — mirrors server/db/init.sql. Stored separately from users; one row
 * per user, cascade-deleted with the user.
 */
export const passwords = pgTable(
  "passwords",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    password: text("password").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("idx_passwords_user_id").on(t.userId)],
);
