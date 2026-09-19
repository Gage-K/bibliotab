import { describe, it, expect } from "vitest";
import {
  createEmptyFrame,
  createSection,
  normalizeBody,
  insertSection,
  removeSection,
  renameSection,
  moveMeasure,
  resolveMoveTarget,
  insertMeasure,
  removeFrame,
  insertFrame,
  resizeFrames,
  bodyStringCount,
  frameDuration,
  setFrameDuration,
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
import type { MeasureType, TabBodyType } from "@/shared/types/tab.types";

// A measure of `frames` empty frames.
function measure(frames: number): MeasureType {
  return Array.from({ length: frames }, () => createEmptyFrame());
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

describe("normalizeBody", () => {
  it("wraps a legacy flat measures array in one default section", () => {
    const legacy = [measure(2), measure(1)];
    const normalized = normalizeBody(legacy);

    expect(normalized.sections).toHaveLength(1);
    expect(normalized.sections[0].name).toBe("Section 1");
    expect(normalized.sections[0].measures).toEqual(legacy);
    expect(normalized.sections[0].id).toBeTruthy();
  });

  it("passes an already-sectioned body through untouched", () => {
    const sectioned = body({ name: "Verse", measures: [1] });
    expect(normalizeBody(sectioned)).toBe(sectioned);
  });

  it("falls back to an empty single-section body for junk", () => {
    expect(normalizeBody(null).sections).toHaveLength(1);
    expect(normalizeBody("nope").sections[0].measures).toHaveLength(1);
  });
});

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
    expect(created.sections[1].measures[0]).toHaveLength(1);
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
    expect(moved.sections[0].measures.map((m) => m.length)).toEqual([3, 1, 2]);
  });

  it("refuses to move a section's only measure away", () => {
    const tab = body({ name: "Intro", measures: [1] }, { name: "Verse", measures: [1] });
    expect(moveMeasure(tab, { section: 0, measure: 0 }, { section: 1, measure: 0 })).toBe(tab);
  });

  it("clamps an out-of-range target index", () => {
    const tab = body({ name: "Intro", measures: [1, 2] }, { name: "Verse", measures: [3] });
    const moved = moveMeasure(tab, { section: 0, measure: 0 }, { section: 1, measure: 99 });
    expect(moved.sections[1].measures.map((m) => m.length)).toEqual([3, 1]);
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

    expect(removed.sections[0].measures[0]).toHaveLength(3);
    expect(removed.sections[1].measures[0]).toHaveLength(2);
  });

  it("keeps a frame's id when its notes change", () => {
    // Frame ids anchor playback highlighting and lyric mapping, so an edit must not
    // mint a new one.
    const tab = body({ name: "Intro", measures: [2] });
    const originalId = tab.sections[0].measures[0][1].id;

    const edited = updateFrameNotes(tab, 0, 0, 1, [{ fret: 5, style: "none" }]);

    expect(edited.sections[0].measures[0][1].id).toBe(originalId);
    expect(edited.sections[0].measures[0][1].notes).toEqual([{ fret: 5, style: "none" }]);
  });

  it("gives a duplicated frame a fresh id", () => {
    const tab = body({ name: "Intro", measures: [1] });
    const sourceId = tab.sections[0].measures[0][0].id;

    const duplicated = insertFrame(tab, 0, 0, 0, false);

    expect(duplicated.sections[0].measures[0]).toHaveLength(2);
    expect(duplicated.sections[0].measures[0][1].id).not.toBe(sourceId);
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
      sections: [createSection("Intro", [[createEmptyFrame(4)]])],
    };
    expect(bodyStringCount(bass)).toBe(4);
  });

  it("propagates the string count through inserts", () => {
    const bass = {
      sections: [createSection("Intro", [[createEmptyFrame(4)]])],
    };

    expect(insertMeasure(bass, 0, 1).sections[0].measures[1][0].notes).toHaveLength(4);
    expect(insertFrame(bass, 0, 0, 0, true).sections[0].measures[0][1].notes).toHaveLength(4);
    expect(
      insertSection(bass, 1, "Verse").sections[1].measures[0][0].notes,
    ).toHaveLength(4);
  });

  it("pads every frame when the string count grows", () => {
    const tab = body({ name: "Intro", measures: [2] });
    const grown = resizeFrames(tab, 7);

    for (const frame of grown.sections[0].measures[0]) {
      expect(frame.notes).toHaveLength(7);
      expect(frame.notes[6]).toEqual({ fret: -2, style: "none" });
    }
  });

  it("truncates from the low end when the string count shrinks, keeping ids", () => {
    const tab = body({ name: "Intro", measures: [1] });
    const originalId = tab.sections[0].measures[0][0].id;
    const withNotes = updateFrameNotes(tab, 0, 0, 0, [
      { fret: 1, style: "none" },
      { fret: 2, style: "none" },
      { fret: 3, style: "none" },
      { fret: 4, style: "none" },
      { fret: 5, style: "none" },
      { fret: 6, style: "none" },
    ]);

    const shrunk = resizeFrames(withNotes, 4);
    const frame = shrunk.sections[0].measures[0][0];

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

    expect(updated.sections[0].measures[0][0].duration).toBe(1);
    expect(updated.sections[0].measures[0][1].duration).toBe(0.5);
    // Ids anchor playback highlighting; a duration edit must not mint a new one.
    expect(updated.sections[0].measures[0][1].id).toBe(
      tab.sections[0].measures[0][1].id,
    );
  });

  it("clamps durations to the supported range", () => {
    const tab = body({ name: "Intro", measures: [1] });
    expect(setFrameDuration(tab, 0, 0, 0, 999).sections[0].measures[0][0].duration).toBe(16);
    expect(setFrameDuration(tab, 0, 0, 0, 0).sections[0].measures[0][0].duration).toBe(
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

describe("frame lookup by id", () => {
  const tab = body(
    { name: "Intro", measures: [2, 1] },
    { name: "Verse", measures: [1, 2] },
  );

  it("finds a frame anywhere in the body", () => {
    const target = tab.sections[1].measures[1][1];
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
    expect(ids.has(tab.sections[0].measures[0][0].id)).toBe(true);
  });

  it("keeps ids stable across a measure move, so anchors survive", () => {
    const movedId = tab.sections[0].measures[0][0].id;
    const moved = moveMeasure(tab, { section: 0, measure: 0 }, { section: 1, measure: 0 });

    expect(findFrameById(moved, movedId)).toEqual({
      section: 1,
      measure: 0,
      frame: 0,
      string: 0,
    });
  });
});
