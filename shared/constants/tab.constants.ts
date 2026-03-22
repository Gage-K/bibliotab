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

export const STANDARD_TUNINGS = {
  standard: ["E", "B", "G", "D", "A", "E"] as TuningNoteType[],
  dropD: ["D", "B", "G", "D", "A", "E"] as TuningNoteType[],
  halfStepDown: ["Eb", "Bb", "Gb", "Db", "Ab", "Eb"] as TuningNoteType[],
  openG: ["D", "B", "G", "D", "G", "D"] as TuningNoteType[],
};

export const FRET_EMPTY = -2;
export const FRET_MUTED = -1;

export const FRET_EMPTY_LABEL = " ";
export const FRET_MUTED_LABEL = "X";

// Validation limits
export const MAX_TAB_MEASURES = 500;
export const MAX_FRAMES_PER_MEASURE = 64;
export const MAX_FRET_NUMBER = 24;
export const MIN_FRET_NUMBER = -2; // FRET_EMPTY
