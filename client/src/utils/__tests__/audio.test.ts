import { describe, it, expect } from "vitest";
import { absoluteNote, flattenTrack, frameToNotes, trackLength } from "../audio";
import { createTrack } from "../trackOperations";
import { createEmptyFrame, createSection } from "../tabOperations";
import { FRET_EMPTY, FRET_MUTED } from "@/shared/types/consts";
import type { FrameType, TuningType } from "@/shared/types/tab.types";

const BASS = ["G", "D", "A", "E"] as TuningType;

function frameWithFrets(frets: number[]): FrameType {
  return { id: "f", notes: frets.map((fret) => ({ fret, style: "none" as const })) };
}

describe("absoluteNote", () => {
  it("names an open string at its own octave", () => {
    expect(absoluteNote("E", 0, 2)).toBe("E2");
    expect(absoluteNote("E", 0, 4)).toBe("E4");
  });

  it("carries into the next octave past the 12th fret", () => {
    expect(absoluteNote("E", 12, 2)).toBe("E3");
    // Low E, 8th fret is C3 — the wrap happens mid-string, not only at fret 12.
    expect(absoluteNote("E", 8, 2)).toBe("C3");
  });

  it("handles flats through their sharp spelling", () => {
    expect(absoluteNote("Eb", 0, 2)).toBe("D#2");
  });
});

describe("frameToNotes", () => {
  const guitar = createTrack({ name: "Guitar" });

  it("sounds an open E major shape at the right octaves", () => {
    // E major: 0 0 1 2 2 0 from high E down to low E.
    const notes = frameToNotes(frameWithFrets([0, 0, 1, 2, 2, 0]), guitar);
    expect(notes).toEqual(["E4", "B3", "G#3", "E3", "B2", "E2"]);
  });

  it("skips empty and muted strings", () => {
    const notes = frameToNotes(
      frameWithFrets([FRET_EMPTY, FRET_MUTED, 0, 2, 2, FRET_MUTED]),
      guitar,
    );
    expect(notes).toEqual(["G3", "E3", "B2"]);
  });

  it("returns nothing for a silent frame", () => {
    expect(frameToNotes(createEmptyFrame(), guitar)).toEqual([]);
  });

  it("uses each track's own tuning and octaves", () => {
    const bass = createTrack({ name: "Bass", instrument: "bass", tuning: BASS });
    // Open bass strings: G2 D2 A1 E1.
    expect(frameToNotes(frameWithFrets([0, 0, 0, 0]), bass)).toEqual([
      "G2",
      "D2",
      "A1",
      "E1",
    ]);
  });
});

describe("flattenTrack", () => {
  const track = createTrack({
    name: "Guitar",
    body: {
      sections: [
        createSection("Intro", [
          [createEmptyFrame(), createEmptyFrame()],
          [createEmptyFrame()],
        ]),
        createSection("Verse", [[createEmptyFrame()]]),
      ],
    },
  });

  it("walks sections and measures in document order", () => {
    const steps = flattenTrack(track);
    expect(steps.map((s) => s.step)).toEqual([0, 1, 2, 3]);
    expect(steps.map((s) => [s.position.section, s.position.measure, s.position.frame])).toEqual(
      [
        [0, 0, 0],
        [0, 0, 1],
        [0, 1, 0],
        [1, 0, 0],
      ],
    );
  });

  it("measures the tab by its longest track", () => {
    const short = createTrack({ name: "Bass", tuning: BASS });
    expect(trackLength([track, short])).toBe(4);
    expect(trackLength([])).toBe(0);
  });
});
