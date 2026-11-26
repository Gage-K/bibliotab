import { describe, it, expect } from "vitest";
import {
  deriveOctaves,
  midiNumber,
  octavesForTuning,
  reconcileOctaves,
} from "@tablab/shared";
import type { TuningType } from "@tablab/shared";

// Moved from the client, which used to keep its own copy of this module.

const GUITAR = ["E", "B", "G", "D", "A", "E"] as TuningType;
const BASS = ["G", "D", "A", "E"] as TuningType;

describe("octave derivation", () => {
  it("reconstructs standard guitar octaves", () => {
    // E4 B3 G3 D3 A2 E2, stored highest string first.
    expect(deriveOctaves(GUITAR)).toEqual([4, 3, 3, 3, 2, 2]);
  });

  it("reconstructs bass octaves from a lower reference", () => {
    // G2 D2 A1 E1.
    expect(deriveOctaves(BASS, 2)).toEqual([2, 2, 1, 1]);
  });

  it("prefers the preset's octaves over derivation", () => {
    // A derived 4-string bass from the default top octave would land two octaves high;
    // the preset knows better.
    expect(octavesForTuning(BASS)).toEqual([2, 2, 1, 1]);
    // The reentrant ukulele cannot be derived at all — its 4th string is the highest.
    expect(octavesForTuning(["A", "E", "C", "G"] as TuningType)).toEqual([4, 4, 4, 4]);
  });
});

describe("reconcileOctaves", () => {
  it("passes a matching-length array through", () => {
    const octaves = [4, 3, 3, 3, 2, 2];
    expect(reconcileOctaves(GUITAR, octaves)).toBe(octaves);
  });

  it("truncates when strings are removed", () => {
    expect(reconcileOctaves(BASS, [4, 3, 3, 3, 2, 2])).toEqual([4, 3, 3, 3]);
  });

  it("continues the descent when strings are added", () => {
    const sevenString = ["E", "B", "G", "D", "A", "E", "B"] as TuningType;
    expect(reconcileOctaves(sevenString, [4, 3, 3, 3, 2, 2])).toEqual([
      4, 3, 3, 3, 2, 2, 1,
    ]);
  });

  it("falls back to the tuning's octaves when there are none", () => {
    expect(reconcileOctaves(GUITAR, undefined)).toEqual([4, 3, 3, 3, 2, 2]);
    expect(reconcileOctaves(GUITAR, [])).toEqual([4, 3, 3, 3, 2, 2]);
  });
});

describe("midiNumber", () => {
  it("puts middle C at 60", () => {
    expect(midiNumber("C", 4, 0)).toBe(60);
  });

  it("counts frets as semitones above the open string", () => {
    // Low E of a guitar is E2 = 40; 5th fret is A2 = 45.
    expect(midiNumber("E", 2, 0)).toBe(40);
    expect(midiNumber("E", 2, 5)).toBe(45);
  });
});
