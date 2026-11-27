/**
 * Seeds a playable demo song ("Ode to Joy", Beethoven — public domain) into the
 * database so you can hear playback end to end.
 *
 * The melody is written as pitches + beat values and the frets are *computed* for
 * standard tuning, so the tab is provably in tune rather than transcribed by hand.
 *
 * Attaches the tab to the first existing user, or `--user <username>`. If the database
 * has no users yet, it creates a demo user (demo / password) so you can log in and open
 * the tab. Uses DB_* from the environment, like the other scripts.
 *
 * Usage:
 *   pnpm seed:song                 # attach to the first user (or create "demo")
 *   pnpm seed:song --user alice    # attach to a specific username
 *   pnpm seed:song --bpm 112       # set the tempo (default 100)
 */
import { randomUUID } from "node:crypto";
import "dotenv/config";
import pg from "pg";
import { hash } from "bcryptjs";

const args = process.argv.slice(2);
const argVal = (flag) => {
  const i = args.indexOf(flag);
  return i === -1 ? null : args[i + 1];
};
const targetUsername = argVal("--user");
const bpm = Number(argVal("--bpm") ?? 100);

// --- Standard tuning, string 1 (highest) first, matching the app's model. ---
const TUNING = ["E", "B", "G", "D", "A", "E"];
const OCTAVES = [4, 3, 3, 3, 2, 2];
const PITCH_CLASS = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5,
  "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11,
};
const semitone = (note, octave) => octave * 12 + PITCH_CLASS[note];
const OPEN = TUNING.map((note, i) => semitone(note, OCTAVES[i]));

/** Lowest-fret placement of a pitch on standard tuning, preferring a higher string. */
function placeNote(note, octave, maxFret = 5) {
  const target = semitone(note, octave);
  for (const limit of [maxFret, 12]) {
    for (let string = 0; string < OPEN.length; string++) {
      const fret = target - OPEN[string];
      if (fret >= 0 && fret <= limit) return { string, fret };
    }
  }
  throw new Error(`Cannot place ${note}${octave} on standard tuning`);
}

const EMPTY = -2;
/** One frame: a single melody note on its string, every other string empty. */
function noteFrame(note, octave, beats) {
  const { string, fret } = placeNote(note, octave);
  const notes = OPEN.map((_open, i) => ({
    fret: i === string ? fret : EMPTY,
    style: "none",
  }));
  return { id: randomUUID(), notes, duration: beats };
}

// --- "Ode to Joy" theme in D major: [note, octave, beats] per melody note. ---
// prettier-ignore
const MELODY = [
  ["F#", 4, 1], ["F#", 4, 1], ["G", 4, 1], ["A", 4, 1],
  ["A", 4, 1], ["G", 4, 1], ["F#", 4, 1], ["E", 4, 1],
  ["D", 4, 1], ["D", 4, 1], ["E", 4, 1], ["F#", 4, 1],
  ["F#", 4, 1.5], ["E", 4, 0.5], ["E", 4, 2],
  ["F#", 4, 1], ["F#", 4, 1], ["G", 4, 1], ["A", 4, 1],
  ["A", 4, 1], ["G", 4, 1], ["F#", 4, 1], ["E", 4, 1],
  ["D", 4, 1], ["D", 4, 1], ["E", 4, 1], ["F#", 4, 1],
  ["E", 4, 1.5], ["D", 4, 0.5], ["D", 4, 2],
];

/** Packs the melody into 4/4 measures (each frame's duration is in beats). */
function toMeasures(melody, beatsPerMeasure = 4) {
  const measures = [];
  let current = [];
  let filled = 0;
  for (const [note, octave, beats] of melody) {
    current.push(noteFrame(note, octave, beats));
    filled += beats;
    if (filled >= beatsPerMeasure - 1e-6) {
      measures.push({ frames: current });
      current = [];
      filled = 0;
    }
  }
  if (current.length) measures.push({ frames: current });
  return measures;
}

const tabData = {
  tracks: [
    {
      id: randomUUID(),
      name: "Guitar",
      instrument: "guitar",
      tuning: TUNING,
      octaves: OCTAVES,
      body: {
        sections: [{ id: randomUUID(), name: "Theme", measures: toMeasures(MELODY) }],
      },
    },
  ],
};

const pool = new pg.Pool({
  host: process.env.DB_HOST ?? "localhost",
  user: process.env.DB_USER ?? "postgres",
  database: process.env.DB_NAME ?? "tablab",
  password: process.env.DB_PASSWORD ?? "postgres",
  port: Number(process.env.DB_PORT ?? 5432),
});

const client = await pool.connect();
try {
  // Find the target user (named, else the first one), or create a demo user.
  let user;
  if (targetUsername) {
    user = (
      await client.query("SELECT id, username FROM users WHERE username = $1", [
        targetUsername,
      ])
    ).rows[0];
    if (!user) throw new Error(`No user named "${targetUsername}"`);
  } else {
    user = (
      await client.query("SELECT id, username FROM users ORDER BY created_at ASC LIMIT 1")
    ).rows[0];
  }

  if (!user) {
    const password = "password";
    user = (
      await client.query(
        "INSERT INTO users (username, email) VALUES ($1, $2) RETURNING id, username",
        ["demo", "demo@example.com"],
      )
    ).rows[0];
    await client.query(
      "INSERT INTO passwords (user_id, password) VALUES ($1, $2)",
      [user.id, await hash(password, 10)],
    );
    console.log(`No users found — created "demo" (password: ${password}).`);
  }

  // Only reference the rhythm columns when the migrations that add them have run, so the
  // seed works on a fresh init.sql database too.
  const cols = (
    await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'tabs'",
    )
  ).rows.map((row) => row.column_name);
  const columns = ["user_id", "tab_name", "tab_artist", "tuning", "tab_data"];
  const values = [
    user.id,
    "Ode to Joy",
    "Ludwig van Beethoven",
    JSON.stringify(TUNING),
    JSON.stringify(tabData),
  ];
  if (cols.includes("bpm")) columns.push("bpm"), values.push(bpm);
  if (cols.includes("time_signature"))
    columns.push("time_signature"), values.push(JSON.stringify([4, 4]));
  if (cols.includes("notes"))
    columns.push("notes"),
      values.push("Beethoven — 'Ode to Joy'. Seeded demo song for testing playback.");

  const placeholders = columns.map((_c, i) => `$${i + 1}`).join(", ");
  const { rows } = await client.query(
    `INSERT INTO tabs (${columns.join(", ")}) VALUES (${placeholders}) RETURNING id`,
    values,
  );

  console.log(
    `Seeded "Ode to Joy" (tab ${rows[0].id}) for user "${user.username}" at ${bpm} bpm.`,
  );
} finally {
  client.release();
  await pool.end();
}
