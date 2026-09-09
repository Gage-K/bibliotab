import { INSTRUMENT_PRESETS, STANDARD_TUNINGS } from "../constants/tab.constants";
import { TuningNoteType, TuningType } from "../types/tab.types";

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

/** Octave of a guitar's high E — the reference point for a derived tuning. */
const DEFAULT_TOP_OCTAVE = 4;

/**
 * Finds the preset whose tuning matches exactly, so a track built from a preset keeps
 * that preset's hand-checked octaves.
 */
export function findMatchingPreset(tuning: TuningType) {
  return INSTRUMENT_PRESETS.find(
    (preset) =>
      preset.tuning.length === tuning.length &&
      preset.tuning.every((note, i) => note === tuning[i])
  );
}

/**
 * Octave per open string for a tuning with no matching preset.
 *
 * Tunings are stored highest string first, so each string should sound at or below the
 * one before it. Walking down the array and dropping an octave whenever the pitch
 * class fails to descend reconstructs the octaves for any conventional tuning. It
 * cannot know about reentrant tunings (a high-G ukulele, say) — those come from
 * presets, which carry their octaves explicitly.
 */
export function deriveOctaves(
  tuning: TuningType,
  topOctave: number = DEFAULT_TOP_OCTAVE
): number[] {
  const octaves: number[] = [];
  for (let i = 0; i < tuning.length; i++) {
    if (i === 0) {
      octaves.push(topOctave);
      continue;
    }
    const previous = octaves[i - 1];
    const descends = SEMITONE[tuning[i]] < SEMITONE[tuning[i - 1]];
    octaves.push(descends ? previous : previous - 1);
  }
  return octaves;
}

/**
 * Octaves for a tuning: the preset's if one matches, otherwise derived. Used whenever
 * a tuning is set without octaves alongside it.
 */
export function octavesForTuning(tuning: TuningType): number[] {
  return findMatchingPreset(tuning)?.octaves ?? deriveOctaves(tuning);
}

/**
 * Reconciles an octaves array with its tuning after the string count changes: extra
 * entries are dropped, and missing ones continue the descent from the last known one.
 */
export function reconcileOctaves(
  tuning: TuningType,
  octaves: number[] | undefined
): number[] {
  if (!octaves || octaves.length === 0) return octavesForTuning(tuning);
  if (octaves.length === tuning.length) return octaves;
  if (octaves.length > tuning.length) return octaves.slice(0, tuning.length);

  const extended = [...octaves];
  for (let i = octaves.length; i < tuning.length; i++) {
    const descends = SEMITONE[tuning[i]] < SEMITONE[tuning[i - 1]];
    extended.push(descends ? extended[i - 1] : extended[i - 1] - 1);
  }
  return extended;
}

/** MIDI note number of a fretted note. Middle C (C4) is 60. */
export function midiNumber(
  openNote: TuningNoteType,
  octave: number,
  fret: number
): number {
  return SEMITONE[openNote] + (octave + 1) * 12 + fret;
}

export const DEFAULT_TUNING: TuningType = STANDARD_TUNINGS.standard;
export const DEFAULT_OCTAVES = [4, 3, 3, 3, 2, 2];
