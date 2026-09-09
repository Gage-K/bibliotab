import { TuningNoteType } from "../types/tab.types";

export const TUNING_NOTES: TuningNoteType[] = [
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
];

/**
 * Tunings list the open note of each string from string 1 (highest) to string N
 * (lowest), so `tuning.toReversed().join("")` reads the way a player would say it
 * ("EADGBE").
 */
export const STANDARD_TUNINGS = {
  standard: ["E", "B", "G", "D", "A", "E"] as TuningNoteType[],
  dropD: ["E", "B", "G", "D", "A", "D"] as TuningNoteType[],
  halfStepDown: ["Eb", "Bb", "Gb", "Db", "Ab", "Eb"] as TuningNoteType[],
  openG: ["D", "B", "G", "D", "G", "D"] as TuningNoteType[],
};

export const DEFAULT_STRING_COUNT = 6;

export type InstrumentPreset = {
  id: string;
  label: string;
  /** Free-text instrument name stored on a track. */
  instrument: string;
  tuning: TuningNoteType[];
  /** Octave of each open string, parallel to `tuning`. */
  octaves: number[];
};

/**
 * Starting points for the tuning picker. The string count falls out of the tuning
 * length, so adding a preset is all it takes to support another instrument.
 */
export const INSTRUMENT_PRESETS: InstrumentPreset[] = [
  {
    id: "guitar-standard",
    label: "Guitar — standard (EADGBE)",
    instrument: "guitar",
    tuning: STANDARD_TUNINGS.standard,
    octaves: [4, 3, 3, 3, 2, 2],
  },
  {
    id: "guitar-drop-d",
    label: "Guitar — drop D (DADGBE)",
    instrument: "guitar",
    tuning: STANDARD_TUNINGS.dropD,
    octaves: [4, 3, 3, 3, 2, 2],
  },
  {
    id: "guitar-half-step-down",
    label: "Guitar — half step down (E♭A♭D♭G♭B♭E♭)",
    instrument: "guitar",
    tuning: STANDARD_TUNINGS.halfStepDown,
    octaves: [4, 3, 3, 3, 2, 2],
  },
  {
    id: "guitar-open-g",
    label: "Guitar — open G (DGDGBD)",
    instrument: "guitar",
    tuning: STANDARD_TUNINGS.openG,
    octaves: [4, 3, 3, 3, 2, 2],
  },
  {
    id: "guitar-7-string",
    label: "7-string guitar (BEADGBE)",
    instrument: "guitar",
    tuning: ["E", "B", "G", "D", "A", "E", "B"] as TuningNoteType[],
    octaves: [4, 3, 3, 3, 2, 2, 1],
  },
  {
    id: "bass-4",
    label: "Bass — 4-string (EADG)",
    instrument: "bass",
    tuning: ["G", "D", "A", "E"] as TuningNoteType[],
    octaves: [2, 2, 1, 1],
  },
  {
    id: "bass-5",
    label: "Bass — 5-string (BEADG)",
    instrument: "bass",
    tuning: ["G", "D", "A", "E", "B"] as TuningNoteType[],
    octaves: [2, 2, 1, 1, 0],
  },
  {
    id: "ukulele",
    label: "Ukulele — standard (GCEA)",
    instrument: "ukulele",
    tuning: ["A", "E", "C", "G"] as TuningNoteType[],
    octaves: [4, 4, 4, 4],
  },
];

export const MIN_STRINGS = 3;
export const MAX_STRINGS = 12;
export const MAX_TRACKS = 16;

export const FRET_EMPTY = -2;
export const FRET_MUTED = -1;

export const FRET_EMPTY_LABEL = " ";
export const FRET_MUTED_LABEL = "X";

// Validation limits
export const MAX_TAB_MEASURES = 500;
export const MAX_FRAMES_PER_MEASURE = 64;
export const MAX_FRET_NUMBER = 24;
export const MIN_FRET_NUMBER = -2; // FRET_EMPTY
