import { pgTable, uuid, varchar, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users.schema";
// Type-only import: erased at build, keeps the JSONB columns typed as the shared
// domain types without pulling the shared package into drizzle-kit's loader.
import type { TabBodyType, TuningType } from "@tablab/shared";

/**
 * tabs — mirrors server/db/init.sql.
 * `tuning` and `tab_data` are JSONB, typed via .$type<>() to the shared domain types.
 *
 * NOTE: init.sql also defines an `update_modified_at` BEFORE UPDATE trigger on this
 * table. It is intentionally NOT modeled here — TabRepository.update sets modified_at
 * explicitly, so the trigger is redundant. Fresh databases created from these
 * migrations won't have the trigger; existing databases still do (harmless).
 */
export const tabs = pgTable(
  "tabs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tabName: varchar("tab_name", { length: 255 }).notNull(),
    tabArtist: varchar("tab_artist", { length: 255 }),
    tuning: jsonb("tuning").$type<TuningType>().notNull(),
    tabData: jsonb("tab_data").$type<TabBodyType>().notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    modifiedAt: timestamp("modified_at").defaultNow(),
  },
  (t) => [
    index("idx_tabs_user_id").on(t.userId),
    index("idx_tabs_modified_at").on(t.modifiedAt.desc()),
  ],
);
