import { describe, it, expect } from "vitest";
import { chordToFrets } from "../frets";
import { createTrack } from "../../trackOperations";
import { frameToNotes } from "../../audio";
import { chordPitchClasses, type ChordSpec } from "../buildChord";
import type { TuningType } from "@/shared/types/tab.types";

const guitar = createTrack({ name: "Guitar" });
const bass = createTrack({
  name: "Bass",
  instrument: "bass",
  tuning: ["G", "D", "A", "E"] as TuningType,
});

/** Pitch classes a fingering actually sounds, via the forward derivation. */
function soundedPitchClasses(notes: ReturnType<typeof chordToFrets>, track = guitar) {
  const names = frameToNotes({ id: "f", notes: notes! }, track);
  const order = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return new Set(names.map((name) => order.indexOf(name.replace(/\d+$/, ""))));
}

describe("chordToFrets", () => {
  it("finds a fingering that sounds every tone of the chord", () => {
    // The forward derivation is the check: whatever frets come out must sound the
    // chord that went in.
    const spec = { rootPc: 4, qualities: ["major"] as const };
    const notes = chordToFrets({ ...spec, qualities: ["major"] }, guitar);

    expect(notes).not.toBeNull();
    expect(soundedPitchClasses(notes)).toEqual(
      new Set(chordPitchClasses({ ...spec, qualities: ["major"] })),
    );
  });

  it("round-trips a range of chords through the forward derivation", () => {
    for (const rootPc of [0, 2, 4, 5, 7, 9, 11]) {
      for (const qualities of [["major"], ["minor"], ["major", "dom7"]] as const) {
        const spec: ChordSpec = { rootPc, qualities: [...qualities] };
        const notes = chordToFrets(spec, guitar);
        expect(notes).not.toBeNull();
        expect(soundedPitchClasses(notes)).toEqual(new Set(chordPitchClasses(spec)));
      }
    }
  });

  it("produces one note per string", () => {
    const notes = chordToFrets({ rootPc: 0, qualities: ["major"] }, guitar);
    expect(notes).toHaveLength(6);

    const bassNotes = chordToFrets({ rootPc: 0, qualities: ["major"] }, bass);
    expect(bassNotes).toHaveLength(4);
  });

  it("keeps the fingering inside a hand's span", () => {
    const notes = chordToFrets({ rootPc: 8, qualities: ["minor", "dom7"] }, guitar)!;
    const fretted = notes.filter((note) => note.fret > 0).map((note) => note.fret);
    if (fretted.length > 1) {
      expect(Math.max(...fretted) - Math.min(...fretted)).toBeLessThanOrEqual(4);
    }
  });

  it("marks unusable strings muted rather than leaving them empty", () => {
    const notes = chordToFrets({ rootPc: 0, qualities: ["major"] }, guitar)!;
    // -2 is "empty"; a chord fingering should never emit one.
    expect(notes.some((note) => note.fret === -2)).toBe(false);
  });

  it("works on a four-string bass tuning", () => {
    const spec: ChordSpec = { rootPc: 7, qualities: ["major"] };
    const notes = chordToFrets(spec, bass);
    expect(notes).not.toBeNull();
    expect(soundedPitchClasses(notes, bass)).toEqual(new Set(chordPitchClasses(spec)));
  });
});
