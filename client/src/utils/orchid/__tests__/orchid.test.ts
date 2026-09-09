import { describe, it, expect } from "vitest";
import {
  applyKeyLock,
  chordIntervals,
  chordName,
  chordPitchClasses,
} from "../buildChord";
import { bassNote, voiceChord } from "../voice";

const C = 0;
const A = 9;

describe("chordIntervals", () => {
  it("defaults to a major triad", () => {
    expect(chordIntervals([])).toEqual([0, 4, 7]);
    expect(chordIntervals(["major"])).toEqual([0, 4, 7]);
  });

  it("builds the standard triads", () => {
    expect(chordIntervals(["minor"])).toEqual([0, 3, 7]);
    expect(chordIntervals(["dim"])).toEqual([0, 3, 6]);
    expect(chordIntervals(["aug"])).toEqual([0, 4, 8]);
    expect(chordIntervals(["sus4"])).toEqual([0, 5, 7]);
  });

  it("stacks an extension onto a triad", () => {
    // Minor + 9 is a minor ninth, not a lookup of some named chord.
    expect(chordIntervals(["minor", "ninth"])).toEqual([0, 3, 7, 14]);
    expect(chordIntervals(["major", "maj7"])).toEqual([0, 4, 7, 11]);
    expect(chordIntervals(["major", "dom7"])).toEqual([0, 4, 7, 10]);
  });

  it("keeps extensions above the octave so the voicer can spread them", () => {
    // A 9th stays at 14 rather than folding to 2, which would put it inside the triad.
    expect(chordIntervals(["major", "ninth"])).toContain(14);
    expect(chordIntervals(["major", "ninth"])).not.toContain(2);
  });

  it("drops the sixth when a seventh is present", () => {
    // A 6 and a b7 sit a semitone apart; holding both is a cluster, not a chord.
    expect(chordIntervals(["major", "sixth", "dom7"])).not.toContain(9);
    expect(chordIntervals(["major", "sixth"])).toContain(9);
  });

  it("lets only one triad quality apply at a time", () => {
    // Whichever triad is listed first wins; a chord can't be both major and minor.
    expect(chordIntervals(["minor", "major"])).toEqual([0, 3, 7]);
  });
});

describe("chordPitchClasses", () => {
  it("gives C major its three tones", () => {
    expect(chordPitchClasses({ rootPc: C, qualities: ["major"] })).toEqual([0, 4, 7]);
  });

  it("wraps around the octave", () => {
    // A major: A C# E.
    expect(chordPitchClasses({ rootPc: A, qualities: ["major"] })).toEqual([1, 4, 9]);
  });

  it("folds an extension into its pitch class", () => {
    // The 9th of C is D, pitch class 2.
    expect(chordPitchClasses({ rootPc: C, qualities: ["major", "ninth"] })).toContain(2);
  });
});

describe("chordName", () => {
  it("names common chords", () => {
    expect(chordName({ rootPc: C, qualities: ["major"] })).toBe("C");
    expect(chordName({ rootPc: A, qualities: ["minor"] })).toBe("Am");
    expect(chordName({ rootPc: C, qualities: ["major", "maj7"] })).toBe("Cmaj7");
    expect(chordName({ rootPc: C, qualities: ["major", "dom7"] })).toBe("C7");
    expect(chordName({ rootPc: A, qualities: ["minor", "ninth"] })).toBe("Am9");
    expect(chordName({ rootPc: C, qualities: ["sus4"] })).toBe("Csus4");
  });
});

describe("applyKeyLock", () => {
  it("keeps a diatonic root and gives it the degree's quality", () => {
    // In C major, D is the ii — minor.
    const locked = applyKeyLock({ rootPc: 2, qualities: ["major"] }, C);
    expect(locked.rootPc).toBe(2);
    expect(locked.qualities).toContain("minor");
  });

  it("snaps a non-diatonic root into the key", () => {
    // C# is not in C major; it snaps to C or D, both of which are.
    const locked = applyKeyLock({ rootPc: 1, qualities: ["major"] }, C);
    expect([0, 2]).toContain(locked.rootPc);
  });

  it("makes the seventh degree diminished", () => {
    // B is the vii° of C major.
    const locked = applyKeyLock({ rootPc: 11, qualities: ["major"] }, C);
    expect(locked.rootPc).toBe(11);
    expect(locked.qualities).toContain("dim");
  });

  it("only ever produces chords in the key", () => {
    const inKey = new Set([0, 2, 4, 5, 7, 9, 11]);
    for (let rootPc = 0; rootPc < 12; rootPc++) {
      const locked = applyKeyLock({ rootPc, qualities: ["major"] }, C);
      expect(inKey.has(locked.rootPc)).toBe(true);
    }
  });

  it("keeps extensions the player is holding", () => {
    // Locking the key shouldn't silently drop a 9th.
    const locked = applyKeyLock({ rootPc: 2, qualities: ["major", "ninth"] }, C);
    expect(locked.qualities).toContain("ninth");
  });
});

describe("voiceChord", () => {
  const cMajor = { rootPc: C, qualities: ["major"] as const };

  it("voices a close triad at the base octave", () => {
    const notes = voiceChord({ ...cMajor, qualities: ["major"] }, {
      spread: 0,
      inversion: 0,
      baseOctave: 3,
    });
    expect(notes).toEqual(["C3", "E3", "G3"]);
  });

  it("opens the voicing as spread increases", () => {
    const close = voiceChord({ ...cMajor, qualities: ["major"] }, {
      spread: 0,
      inversion: 0,
      baseOctave: 3,
    });
    const open = voiceChord({ ...cMajor, qualities: ["major"] }, {
      spread: 1,
      inversion: 0,
      baseOctave: 3,
    });

    expect(open).not.toEqual(close);
    expect(open).toEqual(["C3", "E4", "G5"]);
  });

  it("keeps the chord's identity when spread or inverted", () => {
    // Reshaping must not turn it into a different chord.
    const pitchClassesOf = (notes: string[]) =>
      new Set(notes.map((note) => note.replace(/\d+$/, "")));

    const close = voiceChord({ ...cMajor, qualities: ["major"] }, {
      spread: 0,
      inversion: 0,
      baseOctave: 3,
    });
    const spreadAndInverted = voiceChord({ ...cMajor, qualities: ["major"] }, {
      spread: 0.8,
      inversion: 2,
      baseOctave: 3,
    });

    expect(pitchClassesOf(spreadAndInverted)).toEqual(pitchClassesOf(close));
  });

  it("lifts the lowest tones when inverted", () => {
    const root = voiceChord({ ...cMajor, qualities: ["major"] }, {
      spread: 0,
      inversion: 0,
      baseOctave: 3,
    });
    const first = voiceChord({ ...cMajor, qualities: ["major"] }, {
      spread: 0,
      inversion: 1,
      baseOctave: 3,
    });

    expect(root[0]).toBe("C3");
    // First inversion puts the third on the bottom.
    expect(first[0]).toBe("E3");
  });

  it("returns notes in ascending order", () => {
    const notes = voiceChord({ rootPc: A, qualities: ["minor", "ninth"] }, {
      spread: 0.6,
      inversion: 1,
      baseOctave: 3,
    });

    const semitone = (note: string) => {
      const octave = Number(note.match(/\d+$/)![0]);
      const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      return octave * 12 + names.indexOf(note.replace(/\d+$/, ""));
    };

    for (let i = 1; i < notes.length; i++) {
      expect(semitone(notes[i])).toBeGreaterThanOrEqual(semitone(notes[i - 1]));
    }
  });
});

describe("bassNote", () => {
  it("puts the root two octaves below the voicing", () => {
    expect(bassNote({ rootPc: C, qualities: ["major"] }, 3)).toBe("C1");
    expect(bassNote({ rootPc: A, qualities: ["minor"] }, 4)).toBe("A2");
  });

  it("never goes below octave 0", () => {
    expect(bassNote({ rootPc: C, qualities: ["major"] }, 1)).toBe("C0");
  });
});
