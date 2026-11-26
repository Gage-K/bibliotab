import { FRET_EMPTY, STANDARD_TUNINGS } from "@tablab/shared";
import type { CreateTabPayload } from "../../api/services/tabService";

// Editor-only constants. Everything about the Tab document itself (tunings, presets,
// rhythm limits, fret markers) lives in @tablab/shared, which the server reads too.

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
