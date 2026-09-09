import type { TuningNoteType } from "./tab.types";
import type { CreateTabPayload } from "../../api/services/tabService";

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
 * ("EADGBE"). Mirrors shared/constants/tab.constants.ts.
 */
export const STANDARD_TUNINGS = {
  standard: ["E", "B", "G", "D", "A", "E"] as TuningNoteType[],
  dropD: ["E", "B", "G", "D", "A", "D"] as TuningNoteType[],
  halfStepDown: ["Eb", "Bb", "Gb", "Db", "Ab", "Eb"] as TuningNoteType[],
  openG: ["D", "B", "G", "D", "G", "D"] as TuningNoteType[],
};

export const DEFAULT_STRING_COUNT = 6;
export const MIN_STRINGS = 3;
export const MAX_STRINGS = 12;

export type InstrumentPreset = {
  id: string;
  label: string;
  instrument: string;
  tuning: TuningNoteType[];
};

/**
 * Starting points for the tuning picker. String count falls out of tuning length, so
 * adding a preset is all it takes to support another instrument.
 */
export const INSTRUMENT_PRESETS: InstrumentPreset[] = [
  {
    id: "guitar-standard",
    label: "Guitar — standard",
    instrument: "guitar",
    tuning: STANDARD_TUNINGS.standard,
  },
  {
    id: "guitar-drop-d",
    label: "Guitar — drop D",
    instrument: "guitar",
    tuning: STANDARD_TUNINGS.dropD,
  },
  {
    id: "guitar-half-step-down",
    label: "Guitar — half step down",
    instrument: "guitar",
    tuning: STANDARD_TUNINGS.halfStepDown,
  },
  {
    id: "guitar-open-g",
    label: "Guitar — open G",
    instrument: "guitar",
    tuning: STANDARD_TUNINGS.openG,
  },
  {
    id: "guitar-7-string",
    label: "7-string guitar",
    instrument: "guitar",
    tuning: ["E", "B", "G", "D", "A", "E", "B"] as TuningNoteType[],
  },
  {
    id: "bass-4",
    label: "Bass — 4-string",
    instrument: "bass",
    tuning: ["G", "D", "A", "E"] as TuningNoteType[],
  },
  {
    id: "bass-5",
    label: "Bass — 5-string",
    instrument: "bass",
    tuning: ["G", "D", "A", "E", "B"] as TuningNoteType[],
  },
  {
    id: "ukulele",
    label: "Ukulele",
    instrument: "ukulele",
    tuning: ["A", "E", "C", "G"] as TuningNoteType[],
  },
];

export const FRET_EMPTY = -2;
export const FRET_MUTED = -1;

export const FRET_EMPTY_LABEL = " ";
export const FRET_MUTED_LABEL = "X";

export const DEFAULT_TAB: CreateTabPayload = {
  tab_name: "Untitled",
  tab_artist: "Untitled",
  tuning: ["E", "B", "G", "D", "A", "E"],
  tab_data: {
    sections: [
      {
        id: "1",
        name: "Section 1",
        measures: [
          [
            {
              id: "1",
              notes: [
                { fret: -2, style: "none" },
                { fret: -2, style: "none" },
                { fret: -2, style: "none" },
                { fret: -2, style: "none" },
                { fret: -2, style: "none" },
                { fret: -2, style: "none" },
              ],
            },
          ],
        ],
      },
    ],
  },
};
