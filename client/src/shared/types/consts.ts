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
export const MAX_TRACKS = 16;

/**
 * Beats a frame lasts when it has no stored duration. One beat matches the fixed-step
 * playback that predated the rhythm model, so pre-rhythm tabs sound unchanged.
 */
export const DEFAULT_FRAME_DURATION = 1;
export const DEFAULT_BPM = 90;
export const DEFAULT_TIME_SIGNATURE: [number, number] = [4, 4];

export const MIN_BPM = 30;
export const MAX_BPM = 300;

/** Meters offered for a per-measure override; the tab default covers everything else. */
export const MEASURE_METERS: [number, number][] = [
  [4, 4],
  [3, 4],
  [2, 4],
  [5, 4],
  [6, 8],
  [7, 8],
  [12, 8],
];

/**
 * Base note values offered in the editor, in beats. Dotted values are not listed here —
 * a dot is a separate modifier (×1.5) applied on top, so every entry is a plain value.
 */
export const NOTE_VALUES = [
  { label: "Whole", beats: 4 },
  { label: "Half", beats: 2 },
  { label: "Quarter", beats: 1 },
  { label: "Eighth", beats: 0.5 },
  { label: "Sixteenth", beats: 0.25 },
] as const;

/** Generous cap on the markdown notes field, to bound the row size. */
export const MAX_NOTES_LENGTH = 50_000;

export const MIN_FRAME_DURATION = 0.0625;
export const MAX_FRAME_DURATION = 16;

export type InstrumentPreset = {
  id: string;
  label: string;
  instrument: string;
  tuning: TuningNoteType[];
  /** Octave of each open string, parallel to `tuning`. */
  octaves: number[];
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
    octaves: [4, 3, 3, 3, 2, 2],
  },
  {
    id: "guitar-drop-d",
    label: "Guitar — drop D",
    instrument: "guitar",
    tuning: STANDARD_TUNINGS.dropD,
    octaves: [4, 3, 3, 3, 2, 2],
  },
  {
    id: "guitar-half-step-down",
    label: "Guitar — half step down",
    instrument: "guitar",
    tuning: STANDARD_TUNINGS.halfStepDown,
    octaves: [4, 3, 3, 3, 2, 2],
  },
  {
    id: "guitar-open-g",
    label: "Guitar — open G",
    instrument: "guitar",
    tuning: STANDARD_TUNINGS.openG,
    octaves: [4, 3, 3, 3, 2, 2],
  },
  {
    id: "guitar-7-string",
    label: "7-string guitar",
    instrument: "guitar",
    tuning: ["E", "B", "G", "D", "A", "E", "B"] as TuningNoteType[],
    octaves: [4, 3, 3, 3, 2, 2, 1],
  },
  {
    id: "bass-4",
    label: "Bass — 4-string",
    instrument: "bass",
    tuning: ["G", "D", "A", "E"] as TuningNoteType[],
    octaves: [2, 2, 1, 1],
  },
  {
    id: "bass-5",
    label: "Bass — 5-string",
    instrument: "bass",
    tuning: ["G", "D", "A", "E", "B"] as TuningNoteType[],
    octaves: [2, 2, 1, 1, 0],
  },
  {
    id: "ukulele",
    label: "Ukulele",
    instrument: "ukulele",
    tuning: ["A", "E", "C", "G"] as TuningNoteType[],
    octaves: [4, 4, 4, 4],
  },
];

export const FRET_EMPTY = -2;
export const FRET_MUTED = -1;

export const FRET_EMPTY_LABEL = " ";
export const FRET_MUTED_LABEL = "X";

export const DEFAULT_TAB: CreateTabPayload = {
  tab_name: "Untitled",
  tab_artist: "Untitled",
  // Mirrors tracks[0].tuning; the server ignores it on read.
  tuning: STANDARD_TUNINGS.standard,
  tab_data: {
    tracks: [
      {
        id: "1",
        name: "Track 1",
        instrument: "guitar",
        tuning: STANDARD_TUNINGS.standard,
        octaves: [4, 3, 3, 3, 2, 2],
        body: {
          sections: [
            {
              id: "1",
              name: "Section 1",
              measures: [
                {
                  frames: [
                    {
                      id: "1",
                      notes: Array.from({ length: 6 }, () => ({
                        fret: FRET_EMPTY,
                        style: "none" as const,
                      })),
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ],
  },
};
