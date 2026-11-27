import type { NoteFretType, TuningNoteType } from "@tablab/shared";
import { FRET_EMPTY, FRET_MUTED } from "@tablab/shared";

const SEMITONE: Record<TuningNoteType, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

export const PITCH_CLASS_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export const GUITAR_OPEN_OCTAVES = [4, 3, 3, 3, 2, 2];

/** Pitch class (0–11) of a fretted note on one string. */
export function pitchClass(openNote: TuningNoteType, fret: number): number {
  return (SEMITONE[openNote] + fret) % 12;
}

export function noteName(openNote: TuningNoteType, fret: number): string {
  return PITCH_CLASS_NAMES[pitchClass(openNote, fret)];
}

export function absoluteSemitone(
  openNote: TuningNoteType,
  fret: number,
  baseOctave: number,
): number {
  return SEMITONE[openNote] + fret + 12 * baseOctave;
}

export function derivePitchClass(
  notes: NoteFretType[],
  tuning: TuningNoteType[],
): number[] {
  const set = new Set<number>();
  notes.forEach((n, i) => {
    if (n.fret === FRET_EMPTY || n.fret === FRET_MUTED) return;
    set.add(pitchClass(tuning[i], n.fret));
  });

  return [...set].sort((a, b) => a - b);
}

/**
 * Pitch class of the lowest-sounding note in a frame (the bass), or null if silent.
 */
export function deriveBassPitchClass(
  notes: NoteFretType[],
  tuning: TuningNoteType[],
): number | null {
  let bassSemi = Infinity;
  let bassPc: number | null = null;
  notes.forEach((n, i) => {
    if (n.fret === FRET_EMPTY || n.fret === FRET_MUTED) return;
    const semi = absoluteSemitone(
      tuning[i],
      n.fret,
      GUITAR_OPEN_OCTAVES[i] ?? 3,
    );
    if (semi < bassSemi) {
      bassSemi = semi;
      bassPc = ((semi % 12) + 12) % 12;
    }
  });
  return bassPc;
}

export function noteNamesForFrame(
  notes: NoteFretType[],
  tuning: TuningNoteType[],
): (string | null)[] {
  return notes.map((n, i) =>
    n.fret === FRET_EMPTY || n.fret === FRET_MUTED
      ? null
      : noteName(tuning[i], n.fret),
  );
}
