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

// ============================================================================
// Rhythm
// ============================================================================

/**
 * Beats a frame lasts when it has no stored duration. One beat matches the fixed-step
 * playback that predated the rhythm model, so pre-Phase-5 tabs sound unchanged.
 */
export const DEFAULT_FRAME_DURATION = 1;
export const DEFAULT_BPM = 90;
export const DEFAULT_TIME_SIGNATURE: [number, number] = [4, 4];

export const MIN_BPM = 30;
export const MAX_BPM = 300;

/** Note values offered in the editor, in beats. */
export const NOTE_VALUES = [
  { label: "Whole", beats: 4, symbol: "\u{1D15D}" },
  { label: "Half", beats: 2, symbol: "\u{1D15E}" },
  { label: "Dotted quarter", beats: 1.5, symbol: "\u{1D15F}." },
  { label: "Quarter", beats: 1, symbol: "\u{1D15F}" },
  { label: "Eighth", beats: 0.5, symbol: "\u{1D160}" },
  { label: "Sixteenth", beats: 0.25, symbol: "\u{1D161}" },
] as const;

/** Generous cap on the markdown notes field, to bound the row size. */
export const MAX_NOTES_LENGTH = 50_000;

/** Serialized size cap on the lyric document, for the same reason. */
export const MAX_LYRICS_BYTES = 200_000;

export const MIN_FRAME_DURATION = 0.0625;
export const MAX_FRAME_DURATION = 16;

export const FRET_EMPTY = -2;
export const FRET_MUTED = -1;

export const FRET_EMPTY_LABEL = " ";
export const FRET_MUTED_LABEL = "X";

// Validation limits
export const MAX_TAB_MEASURES = 500;
export const MAX_FRAMES_PER_MEASURE = 64;
export const MAX_FRET_NUMBER = 24;
export const MIN_FRET_NUMBER = -2; // FRET_EMPTY
