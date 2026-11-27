import { describe, it, expect } from "vitest";
import { pitchClass, noteName, derivePitchClass, noteNamesForFrame } from "../pitch";
import { chordNameForFrame } from "../chords";
import type { NoteFretType, TuningNoteType } from "@tablab/shared";

// Standard tuning, stored high-e first (index 0 = high e ... index 5 = low E).
const STD: TuningNoteType[] = ["E", "B", "G", "D", "A", "E"];
const DROP_D: TuningNoteType[] = ["E", "B", "G", "D", "A", "D"];

// Build a frame from fret numbers given in tuning order (index 0 = high e).
// -2 = empty, -1 = muted.
function frame(...frets: number[]): NoteFretType[] {
  return frets.map((fret) => ({ fret, style: "none" as const }));
}

describe("pitchClass / noteName", () => {
  it("computes open-string pitch classes", () => {
    expect(pitchClass("E", 0)).toBe(4);
    expect(pitchClass("A", 0)).toBe(9);
    expect(pitchClass("A", 3)).toBe(0); // A + 3 semitones = C
  });

  it("names notes", () => {
    expect(noteName("E", 0)).toBe("E");
    expect(noteName("G", 1)).toBe("G#");
    expect(noteName("A", 2)).toBe("B");
  });
});

describe("derivePitchClass / noteNamesForFrame", () => {
  it("returns open-string names in standard tuning", () => {
    expect(noteNamesForFrame(frame(0, 0, 0, 0, 0, 0), STD)).toEqual([
      "E", "B", "G", "D", "A", "E",
    ]);
  });

  it("excludes muted (-1) and empty (-2) strings", () => {
    // only the high-e (E) and the A string (open) sound
    const names = noteNamesForFrame(frame(0, -2, -2, -2, 0, -1), STD);
    expect(names).toEqual(["E", null, null, null, "A", null]);
    expect(derivePitchClass(frame(0, -2, -2, -2, 0, -1), STD)).toEqual([4, 9]);
  });
});

describe("chordNameForFrame", () => {
  it("names an open E major chord", () => {
    // low->high 0 2 2 1 0 0  ->  tuning order [e,B,G,D,A,E] = 0,0,1,2,2,0
    expect(chordNameForFrame(frame(0, 0, 1, 2, 2, 0), STD)).toBe("E");
  });

  it("names an open C major chord", () => {
    // low->high X 3 2 0 1 0  ->  tuning order = 0,1,0,2,3,-1
    expect(chordNameForFrame(frame(0, 1, 0, 2, 3, -1), STD)).toBe("C");
  });

  it("disambiguates A minor from C6 via the bass note", () => {
    // low->high X 0 2 2 1 0  ->  tuning order = 0,1,2,2,0,-1
    // pitch-class set {0,4,9} is BOTH Am and C6; bass = A must yield Am.
    expect(chordNameForFrame(frame(0, 1, 2, 2, 0, -1), STD)).toBe("Am");
  });

  it("returns null for a single note", () => {
    expect(chordNameForFrame(frame(-2, -2, -2, -2, 0, -2), STD)).toBeNull();
  });

  it("returns null for an all-empty frame", () => {
    expect(chordNameForFrame(frame(-2, -2, -2, -2, -2, -2), STD)).toBeNull();
  });

  it("resolves a D major that depends on the dropped low D string", () => {
    // Ringing the low D: low->high  0 x 0 2 3 2  ->  tuning order = 2,3,2,0,-1,0.
    // The low string sounds fret 0: in DROP_D that is D (part of the chord), whereas
    // in standard tuning it would be E and break the D-major spelling. So this asserts
    // the tuning is actually being used.
    expect(chordNameForFrame(frame(2, 3, 2, 0, -1, 0), DROP_D)).toBe("D");
  });
});
