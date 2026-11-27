import { describe, it, expect, vi } from "vitest";
import type { Pool } from "pg";
import { TabRepository } from "../../../src/data/repositories/tab.repository";

// The `tabs.tuning` column is retired (nullable since 0007, dropped later). Clients built
// before that still send a top-level `tuning`; the repository must never write it.

const tab_data = {
  tracks: [
    {
      id: "t",
      name: "Track 1",
      instrument: "guitar",
      tuning: ["E", "B", "G", "D", "A", "E"],
      octaves: [4, 3, 3, 3, 2, 2],
      body: { sections: [] },
    },
  ],
};

function mockPool() {
  const query = vi.fn().mockResolvedValue({ rows: [{ id: "tab-1" }] });
  return { pool: { query } as unknown as Pool, query };
}

describe("TabRepository and the retired tuning column", () => {
  it("does not write tuning on create, even when the body carries one", async () => {
    const { pool, query } = mockPool();

    await new TabRepository(pool).create("user-1", {
      tab_name: "Song",
      tab_artist: "Artist",
      tuning: ["D", "A", "D", "G", "B", "E"],
      tab_data,
    } as any);

    const [sql, values] = query.mock.calls[0];
    expect(sql).not.toMatch(/tuning/);
    expect(values).toHaveLength(9);
    expect(JSON.stringify(values)).not.toContain('"D","A","D"');
  });

  it("does not write tuning on update", async () => {
    const { pool, query } = mockPool();

    await new TabRepository(pool).update("tab-1", {
      tab_name: "Renamed",
      tuning: ["D", "A", "D", "G", "B", "E"],
    } as any);

    const [sql] = query.mock.calls[0];
    expect(sql).toMatch(/tab_name = \$1/);
    expect(sql).not.toMatch(/tuning/);
  });
});
