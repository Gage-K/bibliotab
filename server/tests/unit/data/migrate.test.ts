import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { MIGRATIONS_FOLDER, planMigrations } from "../../../src/data/migrate";

const journal = [
  { tag: "0000_base", when: 100 },
  { tag: "0001_next", when: 200 },
  { tag: "0002_last", when: 300 },
];

describe("planMigrations", () => {
  it("applies everything to an empty database", () => {
    expect(planMigrations(journal, null, [])).toEqual({
      kind: "pending",
      tags: ["0000_base", "0001_next", "0002_last"],
    });
  });

  it("refuses a database that has tables but no migration history", () => {
    expect(planMigrations(journal, null, ["tabs", "users"])).toEqual({
      kind: "not-baselined",
      existingTables: ["tabs", "users"],
    });
  });

  it("applies only the migrations after the newest applied one", () => {
    expect(planMigrations(journal, 100, ["tabs", "users"])).toEqual({
      kind: "pending",
      tags: ["0001_next", "0002_last"],
    });
  });

  it("is a no-op when the newest migration is applied", () => {
    expect(planMigrations(journal, 300, ["tabs"])).toEqual({
      kind: "up-to-date",
      latest: "0002_last",
    });
  });

  it("is a no-op when the database is ahead of this code", () => {
    expect(planMigrations(journal, 999, ["tabs"])).toEqual({
      kind: "up-to-date",
      latest: "0002_last",
    });
  });
});

describe("MIGRATIONS_FOLDER", () => {
  it("points at the committed migrations journal", () => {
    const raw = readFileSync(path.join(MIGRATIONS_FOLDER, "meta/_journal.json"), "utf8");
    expect(JSON.parse(raw).entries.length).toBeGreaterThan(0);
  });
});
