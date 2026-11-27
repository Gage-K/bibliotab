/**
 * Backfill `duration` on every frame (Phase 5, rhythm).
 *
 * Frames written before the rhythm model have no duration. Playback before Phase 5 gave
 * every frame one beat, so filling in `1` leaves existing tabs sounding exactly as they
 * did.
 *
 * This walks tracks[].body.sections[].measures[][], which is four levels deep — doing
 * it in application code is far clearer than a recursive jsonb_set, and it is a
 * one-time pass. Rows already carrying durations are skipped, so it is safe to re-run.
 *
 * The read path also defaults a missing duration (DEFAULT_FRAME_DURATION), so a row
 * that never gets this treatment still plays correctly; this makes the stored data
 * match what the app assumes.
 *
 * Usage:
 *   node scripts/backfill-frame-durations.mjs           # uses DB_* from .env
 *   node scripts/backfill-frame-durations.mjs --dry-run # report, change nothing
 *   DB_NAME=other node scripts/backfill-frame-durations.mjs
 */
import "dotenv/config";
import pg from "pg";

const DEFAULT_FRAME_DURATION = 1;

const dryRun = process.argv.includes("--dry-run");

const pool = new pg.Pool({
  host: process.env.DB_HOST ?? "localhost",
  user: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
  database: process.env.DB_NAME ?? "tablab",
  port: Number(process.env.DB_PORT ?? 5432),
});

/**
 * Returns the tab_data with durations filled in, or null if nothing was missing.
 * Returning null lets the caller skip the UPDATE entirely for already-migrated rows.
 */
function withDurations(tabData) {
  let changed = false;

  const tracks = (tabData?.tracks ?? []).map((track) => ({
    ...track,
    body: {
      ...track.body,
      sections: (track.body?.sections ?? []).map((section) => ({
        ...section,
        measures: (section.measures ?? []).map((measure) =>
          measure.map((frame) => {
            if (typeof frame.duration === "number") return frame;
            changed = true;
            return { ...frame, duration: DEFAULT_FRAME_DURATION };
          }),
        ),
      })),
    },
  }));

  return changed ? { ...tabData, tracks } : null;
}

const client = await pool.connect();
let updated = 0;
let skipped = 0;

try {
  const { rows } = await client.query("SELECT id, tab_data FROM tabs");

  for (const row of rows) {
    const next = withDurations(row.tab_data);
    if (!next) {
      skipped++;
      continue;
    }

    if (!dryRun) {
      await client.query("UPDATE tabs SET tab_data = $1 WHERE id = $2", [
        JSON.stringify(next),
        row.id,
      ]);
    }
    updated++;
  }

  console.log(
    `${dryRun ? "[dry run] would update" : "updated"}: ${updated} tab(s); ` +
      `already had durations: ${skipped}`,
  );
} finally {
  client.release();
  await pool.end();
}
