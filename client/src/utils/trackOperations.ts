import { nanoid } from "nanoid";
import type {
  TabBodyType,
  TrackType,
  TuningNoteType,
  TuningType,
} from "../shared/types/tab.types";
import {
  DEFAULT_STRING_COUNT,
  INSTRUMENT_PRESETS,
  STANDARD_TUNINGS,
} from "../shared/types/consts";
import { createEmptyBody, normalizeBody } from "./tabOperations";

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

export const DEFAULT_TUNING: TuningType = STANDARD_TUNINGS.standard;
export const DEFAULT_OCTAVES = [4, 3, 3, 3, 2, 2];

/** The preset whose tuning matches exactly, if any. */
export function findMatchingPreset(tuning: TuningType) {
  return INSTRUMENT_PRESETS.find(
    (preset) =>
      preset.tuning.length === tuning.length &&
      preset.tuning.every((note, i) => note === tuning[i]),
  );
}

/**
 * Octave per open string for a tuning with no matching preset. Tunings are stored
 * highest string first, so each string should sound at or below the one before it;
 * dropping an octave whenever the pitch class fails to descend reconstructs any
 * conventional tuning. Reentrant tunings (a high-G ukulele) come from presets, which
 * carry their octaves explicitly.
 *
 * Mirrors deriveOctaves in shared/utils/tuning.ts.
 */
export function deriveOctaves(
  tuning: TuningType,
  topOctave: number = DEFAULT_TOP_OCTAVE,
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

export function octavesForTuning(tuning: TuningType): number[] {
  return findMatchingPreset(tuning)?.octaves ?? deriveOctaves(tuning);
}

/**
 * Reconciles an octaves array with its tuning after the string count changes: extra
 * entries drop off, missing ones continue the descent.
 */
export function reconcileOctaves(
  tuning: TuningType,
  octaves: number[] | undefined,
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
  fret: number,
): number {
  return SEMITONE[openNote] + (octave + 1) * 12 + fret;
}

export function createTrack(options: Partial<TrackType> = {}): TrackType {
  const tuning = options.tuning ?? DEFAULT_TUNING;
  return {
    id: nanoid(),
    name: options.name ?? "Track 1",
    instrument: options.instrument ?? "guitar",
    tuning,
    octaves: options.octaves
      ? reconcileOctaves(tuning, options.octaves)
      : octavesForTuning(tuning),
    body: options.body ?? createEmptyBody(tuning.length),
  };
}

/**
 * Upgrades any generation of stored tab data into tracks: a legacy flat measures
 * array, a `{ sections }` body, or an already-tracked blob. Mirrors normalizeTabTracks
 * on the server, which normalizes on read and write — this catches anything cached
 * client-side or handed in as demo data.
 */
export function normalizeTracks(
  raw: unknown,
  fallbackTuning: TuningType = DEFAULT_TUNING,
): TrackType[] {
  const tracks =
    raw && typeof raw === "object" && Array.isArray((raw as { tracks?: unknown }).tracks)
      ? (raw as { tracks: Partial<TrackType>[] }).tracks
      : [{ body: normalizeBody(raw) as TabBodyType }];

  if (tracks.length === 0) return [createTrack({ tuning: fallbackTuning })];

  return tracks.map((track, i) => {
    const tuning =
      Array.isArray(track.tuning) && track.tuning.length > 0
        ? track.tuning
        : fallbackTuning;
    return {
      id: track.id ?? nanoid(),
      name: track.name ?? `Track ${i + 1}`,
      instrument: track.instrument ?? "guitar",
      tuning,
      octaves: track.octaves
        ? reconcileOctaves(tuning, track.octaves)
        : octavesForTuning(tuning),
      body: normalizeBody(track.body, tuning.length),
    };
  });
}

/** String count of a track — its tuning is the source of truth. */
export function trackStringCount(track: TrackType | undefined): number {
  return track?.tuning.length ?? DEFAULT_STRING_COUNT;
}
