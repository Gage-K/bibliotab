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

export const STANDARD_TUNINGS = {
  standard: ["E", "B", "G", "D", "A", "E"] as TuningNoteType[],
};

export const FRET_EMPTY = -2;
export const FRET_MUTED = -1;

export const FRET_EMPTY_LABEL = " ";
export const FRET_MUTED_LABEL = "X";

export const DEFAULT_TAB: CreateTabPayload = {
  tab_name: "Untitled",
  tab_artist: "Untitled",
  tuning: ["E", "B", "G", "D", "A", "E"],
  tab_data: [
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
};
