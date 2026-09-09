# Roadmap implementation — what shipped

Phases 2 through 8 of [the roadmap](ROADMAP.md), built on branch `gage/sections`.
Phases 0 (migration tooling) and 1 (pitch/chord derivation) were already in place.

Every phase is one commit. Both packages typecheck, both test suites pass (147 client,
44 server), and both build.

```
443cc60  test(server): vitest config with env isolation and shared alias
695a9f4  feat(sections): group measures into named sections            [Phase 2]
816ef5d  feat(tuning): instruments with any number of strings          [Phase 3a]
200518f  feat(tracks): hold multiple instruments in one tab            [Phase 3b]
17c075f  feat(playback): play the tab through tone.js                  [Phase 4]
d2c0663  feat(rhythm): frame durations, tab tempo and meter            [Phase 5]
8e81741  feat(notes): per-tab markdown notes                           [Phase 6a]
e83481a  feat(lyrics): bind lyric syllables to frames                  [Phase 6b]
5d1f832  feat(orchid): omnichord-style chord instrument                [Phase 7]
8b17e84  feat(sync): align tracks on a shared time grid                [Phase 8]
```

---

## How the data model ended up

The tab body went through three shapes. Every one of them still loads, because the read
path normalizes rather than assuming:

```
MeasureType[]                                    (original)
  → { sections: [{ id, name, measures }] }       (Phase 2)
    → { tracks: [{ id, name, instrument, tuning, octaves, body }] }   (Phase 3b)
```

The final stored shape, in `tabs.tab_data`:

```ts
{
  tracks: [{
    id, name, instrument,
    tuning: TuningNoteType[],   // string 1 (highest) first
    octaves: number[],          // open-string octave, parallel to tuning
    body: { sections: [{ id, name, measures: FrameType[][] }] },
  }]
}
```

with `FrameType = { id, notes: NoteFretType[], duration?: number }`, and `bpm`,
`time_signature`, `notes`, `lyrics` as columns on `tabs`.

**Frets stayed authoritative throughout.** Notes, chord names, playback pitches and the
Orchid's fingerings are all derived; nothing stores a second source of truth. The one
place notes drive frets is the chord inserter, and it writes frets and forgets the chord.

---

## Migrations

| Migration | Kind | Notes |
|---|---|---|
| `0001_wrap_tab_data_in_sections` | hand-written, data-only | Pre-existing |
| `0002_wrap_tab_data_in_tracks` | hand-written, data-only | Wraps body + `tuning` column into `tracks[0]` |
| `0003_add_tempo_and_time_signature` | generated DDL | `bpm`, `time_signature` columns |
| `0004_add_tab_notes` | generated DDL | `notes` TEXT |
| `0005_add_tab_lyrics` | generated DDL | `lyrics` JSONB, nullable |

Plus one script: `pnpm db:backfill-durations` (takes `--dry-run`), which fills `duration`
on every frame. It is a script and not SQL because the walk is four levels deep
(`tracks → body → sections → measures → frames`) and a recursive `jsonb_set` would be
much harder to read than the loop. It skips rows that already have durations.

**To bring a database up to date:**

```bash
cd server
pnpm db:migrate               # applies 0001–0005
pnpm db:backfill-durations    # one-off, safe to re-run
```

On a database that already had the schema and was never baselined, run `pnpm db:baseline`
first — it stamps only `0000`, deliberately, so the later data migrations still run.

None of the migrations were executed against a live database here; there was no DB in
this environment. The SQL and the script are written and reviewed but **unrun**.

---

## Decisions worth knowing about

**Octaves as a parallel array, not baked into note names.** The roadmap suggested
changing tuning entries from `"E"` to `"E2"` at Phase 4. Tracks instead carry
`octaves: number[]` alongside `tuning`. `TuningNoteType` stays a small union the tuning
dropdown can enumerate, octave stays a separate concern from pitch class, and the field
landed in the Phase 3b migration — so tuning still only migrated once, which was the
point of the original suggestion.

**Octaves are not written by the tracks migration.** Deriving them in SQL would mean
duplicating the instrument-preset table and the octave-descent rule in a second language,
and a wrong guess would then be persisted. The read path fills them in from
`octavesForTuning` (which knows the presets exactly) and they are saved on the next write.

**Durations default rather than being required.** `duration` is optional on `FrameType`
and read through `DEFAULT_FRAME_DURATION` (1 beat, matching the fixed-step playback that
preceded it). A frame that never gets backfilled still plays correctly.

**Ticks, not float beats, for the shared grid.** Summing `0.5` eight times drifts, and
that drift is exactly how two tracks that should coincide end up a hair apart. The
timeline compares integer ticks at 960/beat, which divides evenly by 2, 3, 4, 6 and 8.

**Lyric anchors are frame ids, never indices.** Measures move between sections and frames
get inserted; indices shift, ids don't. This is also why `updateFrameNotes` was fixed to
preserve a frame's id — it used to mint a new one on every note edit, which would have
broken every anchor on the first keystroke.

**Markdown is rendered to React elements.** `react-markdown`, not a markdown-to-HTML
string, so nothing reaches `dangerouslySetInnerHTML` and raw HTML in a note is inert.

**Lyrics are validated by envelope, not schema.** The Tiptap schema lives in the editor's
extensions; a server-side copy of it would go stale immediately. The server checks the
document is an object with a `type` and bounds its size.

**Tone.js constraints that shaped the code.** `Tone.start()` runs inside click handlers
(the context only unlocks from a user gesture); the transport is cancelled before
scheduling (or a second play stacks duplicate events and every note fires twice); voices
and FX are disposed on unmount, since they live in the audio graph and nothing else would
collect them.

---

## Corrections made along the way

- **`updateFrameNotes` regenerated frame ids** on every note edit. Fixed in the sections
  commit; it is a prerequisite for both lyric anchoring and playback highlighting.
- **The `dropD` preset lowered the wrong string.** Tunings are stored highest-string
  first, so drop D is `["E","B","G","D","A","D"]`, not `["D","B","G","D","A","E"]`.
- **`db:baseline` stamped the entire journal.** It now stamps only `0000` by default.
  Stamping a data migration marks it applied without running it, which for the sections
  and tracks backfills would have meant the rows silently stayed in the old shape.
- **The server had no vitest config**, so `@tablab/shared` resolved as a bare package and
  any suite importing it failed outright. `auth.service.test.ts` was also asserting
  against whatever secret happened to be in the developer's `.env`, because
  `env.config.ts` validates `process.env` at import time and the test's assignments ran
  after the hoisted imports. Both fixed with a config and a setup file.
- **`tab.service.test.ts` was stale** — it asserted the service returned raw entities and
  referenced fields that no longer existed. Rewritten against the current response shape.

---

## Not done

- **ESLint doesn't run.** The config at the repo root imports `@eslint/js`, which isn't
  installed there (only `client/` and `server/` have `node_modules`). Pre-existing, not
  touched — running `pnpm install` at the root would have been a side effect beyond the
  task. Typecheck and tests were used as the gate instead.
- **No migration was run against a database.** See above.
- **Edit-time track linking** (inserting a beat in one track shifting the others) is
  called out as separately-scoped in the Phase 8 guide and was left alone. Tracks are
  independent while editing; the grid re-derives on every change.
- **The client bundle is over 500 kB** and Vite says so on every build. Tone.js and
  Tiptap are most of the new weight. Code-splitting the Orchid route and the lyric editor
  would be the obvious first move.
- **No integration or end-to-end tests.** Everything added is unit-level: reducers,
  pure utilities, and the serializer. The React components and the audio scheduling are
  untested, and the audio path in particular can only really be judged by ear.

## Worth verifying by hand

Playback and the Orchid make sound, which no test here checks. Worth doing once:

- An open E major shape should sound like E major (the octave derivation is unit-tested
  against `["E4","B3","G#3","E3","B2","E2"]`, but hearing it is the real check).
- A measure of four quarters and a measure of eight eighths should take the same time.
- A guitar-in-eighths and bass-in-quarters tab should line up in the timeline view.
- The Orchid's voicing dial should reshape a chord without changing what chord it is.
