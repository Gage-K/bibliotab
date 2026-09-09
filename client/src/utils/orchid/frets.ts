import { FRET_EMPTY, FRET_MUTED } from "../../shared/types/consts";
import { midiNumber } from "../trackOperations";
import type { NoteFretType, TrackType } from "../../shared/types/tab.types";
import { chordPitchClasses, type ChordSpec } from "./buildChord";

/** Highest fret the finder will reach for. */
const MAX_FRET = 15;
/** Widest fret span a hand is assumed to cover, ignoring open strings. */
const MAX_SPAN = 4;

/**
 * Finds a playable fingering for a chord on a given track's tuning.
 *
 * This is the reverse of the pitch derivation, and it is genuinely one-to-many: a pitch
 * class appears at several frets on several strings. The search is scored rather than
 * exhaustive — pick the lowest workable position, prefer having the root in the bass,
 * and reject anything the hand can't span.
 *
 * Returns null when no position covers enough of the chord, rather than emitting a
 * fingering that leaves tones out silently.
 */
export function chordToFrets(
  spec: ChordSpec,
  track: TrackType,
): NoteFretType[] | null {
  const pitchClasses = new Set(chordPitchClasses(spec));
  if (pitchClasses.size === 0) return null;

  const stringCount = track.tuning.length;
  let best: { notes: NoteFretType[]; score: number } | null = null;

  // Sweep hand positions from the nut up; the first workable one is usually the one a
  // player would reach for, and scoring breaks ties among the rest.
  for (let position = 0; position + MAX_SPAN <= MAX_FRET; position++) {
    const notes: NoteFretType[] = [];
    const covered = new Set<number>();

    for (let stringIndex = 0; stringIndex < stringCount; stringIndex++) {
      const openMidi = midiNumber(
        track.tuning[stringIndex],
        track.octaves[stringIndex] ?? 3,
        0,
      );

      let chosen = FRET_MUTED;
      // Open strings are free regardless of hand position, so they are tried first.
      for (const fret of [0, ...range(position, position + MAX_SPAN)]) {
        if (fret === 0 && position === 0) continue;
        const pitchClass = (openMidi + fret) % 12;
        if (!pitchClasses.has(pitchClass)) continue;
        chosen = fret;
        covered.add(pitchClass);
        break;
      }

      notes.push({ fret: chosen, style: "none" });
    }

    // A fingering that can't sound every tone isn't this chord.
    if (covered.size < pitchClasses.size) continue;

    const score = scoreFingering(notes, spec.rootPc, track, position);
    if (!best || score < best.score) best = { notes, score };
  }

  return best?.notes ?? null;
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_unused, i) => from + i);
}

/** Lower is better. */
function scoreFingering(
  notes: NoteFretType[],
  rootPc: number,
  track: TrackType,
  position: number,
): number {
  const fretted = notes.filter((note) => note.fret > 0).map((note) => note.fret);
  const muted = notes.filter((note) => note.fret === FRET_MUTED).length;
  const span = fretted.length > 0 ? Math.max(...fretted) - Math.min(...fretted) : 0;

  // The lowest sounding string; a chord with its root in the bass sounds settled.
  const lowestIndex = findLastSounding(notes);
  const bassPc =
    lowestIndex === -1
      ? -1
      : (midiNumber(
          track.tuning[lowestIndex],
          track.octaves[lowestIndex] ?? 3,
          notes[lowestIndex].fret,
        ) % 12);

  return (
    position * 1.5 + span * 2 + muted * 3 + (bassPc === rootPc ? 0 : 4)
  );
}

/** Tunings are stored highest string first, so the lowest string is the last one. */
function findLastSounding(notes: NoteFretType[]): number {
  for (let i = notes.length - 1; i >= 0; i--) {
    if (notes[i].fret >= 0) return i;
  }
  return -1;
}

/** An all-empty frame's worth of notes, for clearing. */
export function emptyNotes(stringCount: number): NoteFretType[] {
  return Array.from({ length: stringCount }, () => ({
    fret: FRET_EMPTY,
    style: "none" as const,
  }));
}
