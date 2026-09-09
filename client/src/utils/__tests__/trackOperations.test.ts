import { describe, it, expect } from "vitest";
import {
  createTrack,
  deriveOctaves,
  midiNumber,
  normalizeTracks,
  octavesForTuning,
  reconcileOctaves,
} from "../trackOperations";
import { createEmptyFrame } from "../tabOperations";
import type { TuningType } from "@/shared/types/tab.types";

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

describe("normalizeTracks", () => {
  it("wraps a legacy flat measures array in one guitar track", () => {
    const legacy = [[createEmptyFrame()], [createEmptyFrame()]];
    const tracks = normalizeTracks(legacy);

    expect(tracks).toHaveLength(1);
    expect(tracks[0].instrument).toBe("guitar");
    expect(tracks[0].body.sections[0].measures).toHaveLength(2);
  });

  it("wraps a sectioned body in one track, keeping the fallback tuning", () => {
    const sectioned = { sections: [{ id: "s", name: "Intro", measures: [[createEmptyFrame(4)]] }] };
    const tracks = normalizeTracks(sectioned, BASS);

    expect(tracks).toHaveLength(1);
    expect(tracks[0].tuning).toEqual(BASS);
    expect(tracks[0].octaves).toEqual([2, 2, 1, 1]);
  });

  it("fills in fields a stored track is missing", () => {
    const partial = {
      tracks: [{ body: { sections: [{ id: "s", name: "Intro", measures: [[createEmptyFrame()]] }] } }],
    };
    const tracks = normalizeTracks(partial);

    expect(tracks[0].id).toBeTruthy();
    expect(tracks[0].name).toBe("Track 1");
    expect(tracks[0].tuning).toEqual(GUITAR);
    expect(tracks[0].octaves).toEqual([4, 3, 3, 3, 2, 2]);
  });

  it("passes a well-formed multi-track blob through", () => {
    const tracks = normalizeTracks({
      tracks: [
        createTrack({ name: "Guitar" }),
        createTrack({ name: "Bass", instrument: "bass", tuning: BASS }),
      ],
    });

    expect(tracks.map((t) => t.name)).toEqual(["Guitar", "Bass"]);
    expect(tracks[1].tuning).toEqual(BASS);
  });
});
