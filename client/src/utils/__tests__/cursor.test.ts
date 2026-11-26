import { describe, expect, it } from "vitest";
import { moveCursor, type CursorMotion } from "../cursor";
import { createEmptyFrame, createSection } from "../tabOperations";
import type { MeasureType, TabBodyType } from "@tablab/shared";
import type { TabPositionType } from "../../shared/types/utilities.types";

function measure(frames: number): MeasureType {
  return { frames: Array.from({ length: frames }, () => createEmptyFrame()) };
}

// Body with one section per entry, each holding measures of the given frame counts.
function body(...sections: number[][]): TabBodyType {
  return {
    sections: sections.map((measures, i) =>
      createSection(`S${i}`, measures.map((frames) => measure(frames))),
    ),
  };
}

// Intro: two measures of 2 and 3 frames. Verse: one measure of 2 frames.
const TAB = body([2, 3], [2]);
const STRINGS = 6;

const at = (section: number, measure: number, frame: number, string = 0): TabPositionType => ({
  section,
  measure,
  frame,
  string,
});

const move = (cursor: TabPositionType, motion: CursorMotion) =>
  moveCursor(TAB, cursor, motion, STRINGS);

const forward: CursorMotion = { by: "frame", delta: 1 };
const back: CursorMotion = { by: "frame", delta: -1 };
const nextMeasure: CursorMotion = { by: "measureStart", delta: 1 };
const prevMeasure: CursorMotion = { by: "measureStart", delta: -1 };

describe("moving a frame at a time", () => {
  it("steps within a measure", () => {
    expect(move(at(0, 1, 0), forward)).toEqual(at(0, 1, 1));
    expect(move(at(0, 1, 2), back)).toEqual(at(0, 1, 1));
  });

  it("crosses into the next measure's first frame", () => {
    expect(move(at(0, 0, 1), forward)).toEqual(at(0, 1, 0));
  });

  it("crosses into the next section's first frame", () => {
    expect(move(at(0, 1, 2), forward)).toEqual(at(1, 0, 0));
  });

  it("crosses back into the previous measure's last frame", () => {
    expect(move(at(0, 1, 0), back)).toEqual(at(0, 0, 1));
  });

  it("crosses back into the previous section's last frame", () => {
    expect(move(at(1, 0, 0), back)).toEqual(at(0, 1, 2));
  });

  it("stays put at the very start and the very end", () => {
    const start = at(0, 0, 0);
    const end = at(1, 0, 1);
    expect(move(start, back)).toBe(start);
    expect(move(end, forward)).toBe(end);
  });

  it("keeps the string", () => {
    expect(move(at(0, 0, 1, 4), forward)).toEqual(at(0, 1, 0, 4));
  });
});

describe("moving a measure at a time", () => {
  it("goes to the start of the next measure", () => {
    expect(move(at(0, 0, 1), nextMeasure)).toEqual(at(0, 1, 0));
  });

  it("goes to the start of the next section after its last measure", () => {
    expect(move(at(0, 1, 2), nextMeasure)).toEqual(at(1, 0, 0));
  });

  it("goes to the start of the current measure first when partway through it", () => {
    expect(move(at(0, 1, 2), prevMeasure)).toEqual(at(0, 1, 0));
  });

  it("goes to the start of the previous measure from a measure's start", () => {
    expect(move(at(0, 1, 0), prevMeasure)).toEqual(at(0, 0, 0));
  });

  it("goes to the start of the previous section's last measure", () => {
    expect(move(at(1, 0, 0), prevMeasure)).toEqual(at(0, 1, 0));
  });

  it("stays put at the first and last measures of the tab", () => {
    const start = at(0, 0, 0);
    const last = at(1, 0, 1);
    expect(move(start, prevMeasure)).toBe(start);
    expect(move(last, nextMeasure)).toBe(last);
  });

  it("keeps the string", () => {
    expect(move(at(0, 0, 1, 3), nextMeasure)).toEqual(at(0, 1, 0, 3));
  });
});

describe("moving across strings", () => {
  it("moves down and up a string, staying on the frame", () => {
    expect(move(at(0, 1, 1, 2), { by: "string", delta: 1 })).toEqual(at(0, 1, 1, 3));
    expect(move(at(0, 1, 1, 2), { by: "string", delta: -1 })).toEqual(at(0, 1, 1, 1));
  });

  it("stops at the top and bottom strings of the instrument", () => {
    const top = at(0, 0, 0, 0);
    const bottom = at(0, 0, 0, STRINGS - 1);
    expect(move(top, { by: "string", delta: -1 })).toBe(top);
    expect(move(bottom, { by: "string", delta: 1 })).toBe(bottom);
  });

  it("uses the instrument's string count", () => {
    const bass = at(0, 0, 0, 3);
    expect(moveCursor(TAB, bass, { by: "string", delta: 1 }, 4)).toBe(bass);
  });
});

describe("jumping to a frame", () => {
  it("goes to an existing frame, keeping the string", () => {
    expect(move(at(0, 0, 0, 5), { to: { section: 1, measure: 0, frame: 1 } })).toEqual(
      at(1, 0, 1, 5),
    );
  });

  it("ignores a frame that does not exist", () => {
    const cursor = at(0, 0, 0);
    expect(move(cursor, { to: { section: 0, measure: 0, frame: 2 } })).toBe(cursor);
    expect(move(cursor, { to: { section: 2, measure: 0, frame: 0 } })).toBe(cursor);
  });
});
