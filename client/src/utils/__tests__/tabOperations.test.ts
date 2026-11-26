import { describe, it, expect } from "vitest";
import {
  createEmptyFrame,
  createSection,
  insertSection,
  removeSection,
  renameSection,
  moveMeasure,
  resolveMoveTarget,
  nudgeFrameRange,
  moveFrameRangeToMeasure,
  deleteFrameRange,
  duplicateFrameRange,
  insertMeasure,
  removeFrame,
  insertFrame,
  resizeFrames,
  bodyStringCount,
  frameDuration,
  setFrameDuration,
  stepDuration,
  isDottedDuration,
  baseDuration,
  toggleDot,
  setFrameRest,
  isRestFrame,
  setMeasureTimeSignature,
  measureTimeSignature,
  measureBeats,
  measureIsComplete,
  findFrameById,
  collectFrameIds,
  updateFrameNotes,
  frameOrdinal,
  sectionMeasureOffset,
  totalMeasures,
  isExistingPosition,
} from "../tabOperations";
import type { MeasureType, TabBodyType } from "@tablab/shared";

// A measure of `frames` empty frames.
function measure(frames: number): MeasureType {
  return { frames: Array.from({ length: frames }, () => createEmptyFrame()) };
}

// Body with one section per entry, each holding measures of the given frame counts.
function body(...sections: { name: string; measures: number[] }[]): TabBodyType {
  return {
    sections: sections.map((s) =>
      createSection(
        s.name,
        s.measures.map((frames) => measure(frames)),
      ),
    ),
  };
}

// Normalizing stored bodies is tested with the shared module it lives in
// (server/tests/unit/shared/tab.serializer.test.ts).

describe("section operations", () => {
  it("inserts a section at an index, clamping out-of-range ones", () => {
    const tab = body({ name: "Intro", measures: [1] }, { name: "Verse", measures: [1] });

    expect(insertSection(tab, 1, "Bridge").sections.map((s) => s.name)).toEqual([
      "Intro",
      "Bridge",
      "Verse",
    ]);
    expect(insertSection(tab, 99, "Outro").sections.map((s) => s.name)).toEqual([
      "Intro",
      "Verse",
      "Outro",
    ]);
    expect(insertSection(tab, -1, "Count-in").sections[0].name).toBe("Count-in");
  });

  it("gives a new section one empty measure", () => {
    const created = insertSection(body({ name: "Intro", measures: [1] }), 1, "Verse");
    expect(created.sections[1].measures).toHaveLength(1);
    expect(created.sections[1].measures[0].frames).toHaveLength(1);
  });

  it("renames a section without touching its measures", () => {
    const tab = body({ name: "Intro", measures: [2] });
    const renamed = renameSection(tab, 0, "Chorus");
    expect(renamed.sections[0].name).toBe("Chorus");
    expect(renamed.sections[0].measures).toBe(tab.sections[0].measures);
  });

  it("removes a section but never the last one", () => {
    const two = body({ name: "Intro", measures: [1] }, { name: "Verse", measures: [1] });
    expect(removeSection(two, 0).sections.map((s) => s.name)).toEqual(["Verse"]);

    const one = body({ name: "Intro", measures: [1] });
    expect(removeSection(one, 0)).toBe(one);
  });
});

describe("moveMeasure", () => {
  it("moves a measure into another section", () => {
    const tab = body({ name: "Intro", measures: [1, 2] }, { name: "Verse", measures: [3] });
    const movedMeasure = tab.sections[0].measures[1];

    const moved = moveMeasure(tab, { section: 0, measure: 1 }, { section: 1, measure: 0 });

    expect(moved.sections[0].measures).toHaveLength(1);
    expect(moved.sections[1].measures).toHaveLength(2);
    expect(moved.sections[1].measures[0]).toBe(movedMeasure);
  });

  it("reorders within a section", () => {
    const tab = body({ name: "Intro", measures: [1, 2, 3] });
    const third = tab.sections[0].measures[2];

    const moved = moveMeasure(tab, { section: 0, measure: 2 }, { section: 0, measure: 0 });

    expect(moved.sections[0].measures[0]).toBe(third);
    expect(moved.sections[0].measures.map((m) => m.frames.length)).toEqual([3, 1, 2]);
  });

  it("refuses to move a section's only measure away", () => {
    const tab = body({ name: "Intro", measures: [1] }, { name: "Verse", measures: [1] });
    expect(moveMeasure(tab, { section: 0, measure: 0 }, { section: 1, measure: 0 })).toBe(tab);
  });

  it("clamps an out-of-range target index", () => {
    const tab = body({ name: "Intro", measures: [1, 2] }, { name: "Verse", measures: [3] });
    const moved = moveMeasure(tab, { section: 0, measure: 0 }, { section: 1, measure: 99 });
    expect(moved.sections[1].measures.map((m) => m.frames.length)).toEqual([3, 1]);
  });

  it("reports where the measure lands", () => {
    const tab = body({ name: "Intro", measures: [1, 2] }, { name: "Verse", measures: [3] });
    expect(resolveMoveTarget(tab, { section: 0, measure: 0 }, { section: 1, measure: 99 })).toEqual({
      section: 1,
      measure: 1,
    });
    expect(resolveMoveTarget(tab, { section: 0, measure: 1 }, { section: 0, measure: 0 })).toEqual({
      section: 0,
      measure: 0,
    });
  });
});

describe("section-aware measure and frame ops", () => {
  it("inserts a measure into the addressed section only", () => {
    const tab = body({ name: "Intro", measures: [1] }, { name: "Verse", measures: [1] });
    const withMeasure = insertMeasure(tab, 1, 1);

    expect(withMeasure.sections[0].measures).toHaveLength(1);
    expect(withMeasure.sections[1].measures).toHaveLength(2);
    expect(withMeasure.sections[0]).toBe(tab.sections[0]);
  });

  it("removes a frame from the addressed section only", () => {
    const tab = body({ name: "Intro", measures: [3] }, { name: "Verse", measures: [3] });
    const removed = removeFrame(tab, 1, 0, 1);

    expect(removed.sections[0].measures[0].frames).toHaveLength(3);
    expect(removed.sections[1].measures[0].frames).toHaveLength(2);
  });

  it("keeps a frame's id when its notes change", () => {
    // Frame ids anchor playback highlighting, so an edit must not mint a new one.
    const tab = body({ name: "Intro", measures: [2] });
    const originalId = tab.sections[0].measures[0].frames[1].id;

    const edited = updateFrameNotes(tab, 0, 0, 1, [{ fret: 5, style: "none" }]);

    expect(edited.sections[0].measures[0].frames[1].id).toBe(originalId);
    expect(edited.sections[0].measures[0].frames[1].notes).toEqual([{ fret: 5, style: "none" }]);
  });

  it("gives a duplicated frame a fresh id", () => {
    const tab = body({ name: "Intro", measures: [1] });
    const sourceId = tab.sections[0].measures[0].frames[0].id;

    const duplicated = insertFrame(tab, 0, 0, 0, false);

    expect(duplicated.sections[0].measures[0].frames).toHaveLength(2);
    expect(duplicated.sections[0].measures[0].frames[1].id).not.toBe(sourceId);
  });

  it("knows which positions exist", () => {
    const tab = body({ name: "Intro", measures: [2] });
    expect(isExistingPosition(tab, 0, 0, 1)).toBe(true);
    expect(isExistingPosition(tab, 0, 0, 2)).toBe(false);
    expect(isExistingPosition(tab, 1, 0, 0)).toBe(false);
  });
});

describe("document-order helpers", () => {
  const tab = body({ name: "Intro", measures: [2, 3] }, { name: "Verse", measures: [4] });

  it("counts frames before a position across sections", () => {
    expect(frameOrdinal(tab, { section: 0, measure: 0, frame: 0 })).toBe(0);
    expect(frameOrdinal(tab, { section: 0, measure: 1, frame: 1 })).toBe(3);
    expect(frameOrdinal(tab, { section: 1, measure: 0, frame: 0 })).toBe(5);
  });

  it("numbers measures continuously across sections", () => {
    expect(sectionMeasureOffset(tab, 0)).toBe(0);
    expect(sectionMeasureOffset(tab, 1)).toBe(2);
    expect(totalMeasures(tab)).toBe(3);
  });
});

describe("variable string counts", () => {
  it("builds frames with one row per string", () => {
    expect(createEmptyFrame(4).notes).toHaveLength(4);
    expect(createEmptyFrame(7).notes).toHaveLength(7);
    // The default keeps six-string callers working unchanged.
    expect(createEmptyFrame().notes).toHaveLength(6);
  });

  it("reads a body's string count off its first frame", () => {
    const bass = {
      sections: [createSection("Intro", [{ frames: [createEmptyFrame(4)] }])],
    };
    expect(bodyStringCount(bass)).toBe(4);
  });

  it("propagates the string count through inserts", () => {
    const bass = {
      sections: [createSection("Intro", [{ frames: [createEmptyFrame(4)] }])],
    };

    expect(insertMeasure(bass, 0, 1).sections[0].measures[1].frames[0].notes).toHaveLength(4);
    expect(insertFrame(bass, 0, 0, 0, true).sections[0].measures[0].frames[1].notes).toHaveLength(4);
    expect(
      insertSection(bass, 1, "Verse").sections[1].measures[0].frames[0].notes,
    ).toHaveLength(4);
  });

  it("pads every frame when the string count grows", () => {
    const tab = body({ name: "Intro", measures: [2] });
    const grown = resizeFrames(tab, 7);

    for (const frame of grown.sections[0].measures[0].frames) {
      expect(frame.notes).toHaveLength(7);
      expect(frame.notes[6]).toEqual({ fret: -2, style: "none" });
    }
  });

  it("truncates from the low end when the string count shrinks, keeping ids", () => {
    const tab = body({ name: "Intro", measures: [1] });
    const originalId = tab.sections[0].measures[0].frames[0].id;
    const withNotes = updateFrameNotes(tab, 0, 0, 0, [
      { fret: 1, style: "none" },
      { fret: 2, style: "none" },
      { fret: 3, style: "none" },
      { fret: 4, style: "none" },
      { fret: 5, style: "none" },
      { fret: 6, style: "none" },
    ]);

    const shrunk = resizeFrames(withNotes, 4);
    const frame = shrunk.sections[0].measures[0].frames[0];

    expect(frame.id).toBe(originalId);
    expect(frame.notes.map((n) => n.fret)).toEqual([1, 2, 3, 4]);
  });

  it("is a no-op when the count already matches", () => {
    const tab = body({ name: "Intro", measures: [1] });
    expect(resizeFrames(tab, 6)).toBe(tab);
  });
});

describe("frame durations", () => {
  it("defaults a frame with no stored duration to one beat", () => {
    expect(frameDuration({ id: "a", notes: [] })).toBe(1);
    expect(frameDuration({ id: "a", notes: [], duration: 0.5 })).toBe(0.5);
  });

  it("gives new frames a quarter-note duration", () => {
    expect(createEmptyFrame().duration).toBe(1);
    expect(createEmptyFrame(6, 0.25).duration).toBe(0.25);
  });

  it("sets one frame's duration and leaves the rest alone", () => {
    const tab = body({ name: "Intro", measures: [2] });
    const updated = setFrameDuration(tab, 0, 0, 1, 0.5);

    expect(updated.sections[0].measures[0].frames[0].duration).toBe(1);
    expect(updated.sections[0].measures[0].frames[1].duration).toBe(0.5);
    // Ids anchor playback highlighting; a duration edit must not mint a new one.
    expect(updated.sections[0].measures[0].frames[1].id).toBe(
      tab.sections[0].measures[0].frames[1].id,
    );
  });

  it("clamps durations to the supported range", () => {
    const tab = body({ name: "Intro", measures: [1] });
    expect(setFrameDuration(tab, 0, 0, 0, 999).sections[0].measures[0].frames[0].duration).toBe(16);
    expect(setFrameDuration(tab, 0, 0, 0, 0).sections[0].measures[0].frames[0].duration).toBe(
      0.0625,
    );
  });

  it("sums a measure's beats", () => {
    const tab = setFrameDuration(body({ name: "Intro", measures: [3] }), 0, 0, 0, 0.5);
    expect(measureBeats(tab.sections[0].measures[0])).toBe(2.5);
  });

  it("knows whether a measure fills its meter", () => {
    const fourQuarters = body({ name: "Intro", measures: [4] }).sections[0].measures[0];
    expect(measureIsComplete(fourQuarters, [4, 4])).toBe(true);
    expect(measureIsComplete(fourQuarters, [3, 4])).toBe(false);

    // 6/8 is three quarter notes' worth, not six.
    const threeQuarters = body({ name: "Intro", measures: [3] }).sections[0].measures[0];
    expect(measureIsComplete(threeQuarters, [6, 8])).toBe(true);
  });
});

describe("moving a run of frames", () => {
  // Section 0: measure [a b c d], measure [e f]. Frames labelled by id.
  function labelled(): TabBodyType {
    const frame = (id: string) => ({ id, notes: [] });
    return {
      sections: [
        createSection("Intro", [
          { frames: ["a", "b", "c", "d"].map(frame) },
          { frames: ["e", "f"].map(frame) },
        ]),
      ],
    };
  }
  const ids = (tab: TabBodyType, m: number) =>
    tab.sections[0].measures[m].frames.map((f) => f.id);

  it("nudges a single frame right within a measure", () => {
    const { tab, range } = nudgeFrameRange(
      labelled(),
      { section: 0, measure: 0, start: 1, end: 1 },
      "right"
    );
    expect(ids(tab, 0)).toEqual(["a", "c", "b", "d"]);
    expect(range).toMatchObject({ measure: 0, start: 2, end: 2 });
  });

  it("nudges a block left within a measure", () => {
    const { tab, range } = nudgeFrameRange(
      labelled(),
      { section: 0, measure: 0, start: 1, end: 2 },
      "left"
    );
    expect(ids(tab, 0)).toEqual(["b", "c", "a", "d"]);
    expect(range).toMatchObject({ start: 0, end: 1 });
  });

  it("hops into the next measure at the right edge", () => {
    const { tab, range } = nudgeFrameRange(
      labelled(),
      { section: 0, measure: 0, start: 3, end: 3 },
      "right"
    );
    expect(ids(tab, 0)).toEqual(["a", "b", "c"]);
    expect(ids(tab, 1)).toEqual(["d", "e", "f"]);
    expect(range).toMatchObject({ measure: 1, start: 0, end: 0 });
  });

  it("hops into the previous measure at the left edge", () => {
    const { tab, range } = nudgeFrameRange(
      labelled(),
      { section: 0, measure: 1, start: 0, end: 0 },
      "left"
    );
    expect(ids(tab, 0)).toEqual(["a", "b", "c", "d", "e"]);
    expect(ids(tab, 1)).toEqual(["f"]);
    expect(range).toMatchObject({ measure: 0, start: 4, end: 4 });
  });

  it("no-ops at the section's very start", () => {
    const start = labelled();
    expect(
      nudgeFrameRange(start, { section: 0, measure: 0, start: 0, end: 0 }, "left").tab
    ).toBe(start);
  });

  it("moves a block to the next measure, prepending", () => {
    const { tab, range } = moveFrameRangeToMeasure(
      labelled(),
      { section: 0, measure: 0, start: 0, end: 1 },
      1
    );
    expect(ids(tab, 0)).toEqual(["c", "d"]);
    expect(ids(tab, 1)).toEqual(["a", "b", "e", "f"]);
    expect(range).toMatchObject({ measure: 1, start: 0, end: 1 });
  });

  it("drops a measure emptied by the move", () => {
    const { tab, range } = moveFrameRangeToMeasure(
      labelled(),
      { section: 0, measure: 1, start: 0, end: 1 },
      -1
    );
    expect(tab.sections[0].measures).toHaveLength(1);
    expect(ids(tab, 0)).toEqual(["a", "b", "c", "d", "e", "f"]);
    expect(range).toMatchObject({ measure: 0, start: 4, end: 5 });
  });
});

describe("deleting and duplicating a run of frames", () => {
  const frame = (id: string) => ({ id, notes: [] });
  const twoMeasure = (): TabBodyType => ({
    sections: [
      createSection("Intro", [
        { frames: ["a", "b", "c", "d"].map(frame) },
        { frames: ["e", "f"].map(frame) },
      ]),
    ],
  });
  const ids = (tab: TabBodyType, m: number) =>
    tab.sections[0].measures[m].frames.map((f) => f.id);

  it("deletes a range within a measure and lands the cursor on it", () => {
    const { tab, position } = deleteFrameRange(twoMeasure(), {
      section: 0,
      measure: 0,
      start: 1,
      end: 2,
    });
    expect(ids(tab, 0)).toEqual(["a", "d"]);
    expect(position).toMatchObject({ section: 0, measure: 0, frame: 1 });
  });

  it("drops a measure emptied by the delete", () => {
    const { tab } = deleteFrameRange(twoMeasure(), {
      section: 0,
      measure: 0,
      start: 0,
      end: 3,
    });
    expect(tab.sections[0].measures).toHaveLength(1);
    expect(ids(tab, 0)).toEqual(["e", "f"]);
  });

  it("keeps one empty frame rather than empty the only measure", () => {
    const only: TabBodyType = {
      sections: [createSection("Intro", [{ frames: ["a", "b"].map(frame) }])],
    };
    const { tab } = deleteFrameRange(only, { section: 0, measure: 0, start: 0, end: 1 });
    expect(tab.sections[0].measures[0].frames).toHaveLength(1);
    expect(tab.sections[0].measures[0].frames[0].id).not.toBe("a");
  });

  it("duplicates a range, inserting fresh-id copies after it", () => {
    const { tab, range } = duplicateFrameRange(twoMeasure(), {
      section: 0,
      measure: 0,
      start: 1,
      end: 2,
    });
    const result = ids(tab, 0);
    expect(result).toHaveLength(6);
    expect(result.slice(0, 3)).toEqual(["a", "b", "c"]);
    expect(result[5]).toBe("d");
    // The two inserted frames are copies with new ids.
    expect(result[3]).not.toBe("b");
    expect(result[4]).not.toBe("c");
    expect(range).toMatchObject({ measure: 0, start: 3, end: 4 });
  });
});

describe("dotted durations", () => {
  it("recognizes a dotted value", () => {
    expect(isDottedDuration(1.5)).toBe(true); // dotted quarter
    expect(isDottedDuration(0.75)).toBe(true); // dotted eighth
    expect(isDottedDuration(1)).toBe(false);
    expect(isDottedDuration(2)).toBe(false);
  });

  it("reads the plain value under a dotted note", () => {
    expect(baseDuration(1.5)).toBe(1);
    expect(baseDuration(1)).toBe(1);
  });

  it("toggles the dot on and off", () => {
    expect(toggleDot(1)).toBe(1.5); // quarter -> dotted quarter
    expect(toggleDot(1.5)).toBe(1); // and back
    expect(toggleDot(0.5)).toBe(0.75); // eighth -> dotted eighth
  });
});

describe("stepDuration", () => {
  it("steps up and down the plain note values", () => {
    expect(stepDuration(1, "longer")).toBe(2); // quarter -> half
    expect(stepDuration(1, "shorter")).toBe(0.5); // quarter -> eighth
    expect(stepDuration(2, "longer")).toBe(4); // half -> whole
  });

  it("keeps the dot while stepping", () => {
    expect(stepDuration(1.5, "shorter")).toBe(0.75); // dotted quarter -> dotted eighth
    expect(stepDuration(1.5, "longer")).toBe(3); // dotted quarter -> dotted half
  });

  it("clamps at the ends", () => {
    expect(stepDuration(4, "longer")).toBe(4); // already the longest
    expect(stepDuration(0.25, "shorter")).toBe(0.25); // already the shortest
  });

  it("snaps an off-list duration to the nearest value first", () => {
    // 0.8 is nearest a quarter (1); one shorter is an eighth.
    expect(stepDuration(0.8, "shorter")).toBe(0.5);
  });
});

describe("rests", () => {
  it("flags a frame as a rest and clears its notes, keeping its duration", () => {
    const tab = setFrameDuration(body({ name: "Intro", measures: [2] }), 0, 0, 0, 2);
    const rested = setFrameRest(tab, 0, 0, 0, true);
    const frame = rested.sections[0].measures[0].frames[0];

    expect(isRestFrame(frame)).toBe(true);
    expect(frame.duration).toBe(2);
    expect(frame.notes.every((note) => note.fret === -2)).toBe(true);
    // A rest still occupies its time in the bar.
    expect(measureBeats(rested.sections[0].measures[0])).toBe(3);
  });

  it("clears the rest flag without touching notes", () => {
    const tab = setFrameRest(body({ name: "Intro", measures: [1] }), 0, 0, 0, true);
    const unrested = setFrameRest(tab, 0, 0, 0, false);
    expect(isRestFrame(unrested.sections[0].measures[0].frames[0])).toBe(false);
  });
});

describe("per-measure time signature", () => {
  it("inherits the tab default until overridden", () => {
    const tab = body({ name: "Intro", measures: [4] });
    expect(measureTimeSignature(tab.sections[0].measures[0], [4, 4])).toEqual([4, 4]);

    const overridden = setMeasureTimeSignature(tab, 0, 0, [5, 4]);
    expect(measureTimeSignature(overridden.sections[0].measures[0], [4, 4])).toEqual([5, 4]);
  });

  it("clears an override back to the tab default", () => {
    const tab = setMeasureTimeSignature(body({ name: "Intro", measures: [4] }), 0, 0, [5, 4]);
    const cleared = setMeasureTimeSignature(tab, 0, 0, null);
    expect(cleared.sections[0].measures[0].timeSignature).toBeUndefined();
    expect(measureTimeSignature(cleared.sections[0].measures[0], [4, 4])).toEqual([4, 4]);
  });
});

describe("frame lookup by id", () => {
  const tab = body(
    { name: "Intro", measures: [2, 1] },
    { name: "Verse", measures: [1, 2] },
  );

  it("finds a frame anywhere in the body", () => {
    const target = tab.sections[1].measures[1].frames[1];
    expect(findFrameById(tab, target.id)).toEqual({
      section: 1,
      measure: 1,
      frame: 1,
      string: 0,
    });
  });

  it("returns null for an id that is not there", () => {
    // A stale frame id (its frame deleted) must go inert, not resolve to a neighbour.
    expect(findFrameById(tab, "gone")).toBeNull();
  });

  it("collects every frame id in the body", () => {
    const ids = collectFrameIds(tab);
    expect(ids.size).toBe(6);
    expect(ids.has(tab.sections[0].measures[0].frames[0].id)).toBe(true);
  });

  it("keeps ids stable across a measure move, so anchors survive", () => {
    const movedId = tab.sections[0].measures[0].frames[0].id;
    const moved = moveMeasure(tab, { section: 0, measure: 0 }, { section: 1, measure: 0 });

    expect(findFrameById(moved, movedId)).toEqual({
      section: 1,
      measure: 0,
      frame: 0,
      string: 0,
    });
  });
});
