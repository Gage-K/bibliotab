import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFretEntry } from "../fretEntry";
import type { TabPositionType } from "../../shared/types/utilities.types";

const note = (frame: number, string = 0): TabPositionType => ({
  section: 0,
  measure: 0,
  frame,
  string,
});

/** A fret entry whose commits are recorded as [frame, string, fret]. */
function setup() {
  const commits: [number, number, number][] = [];
  const entry = createFretEntry((target, fret) => {
    commits.push([target.frame, target.string, fret]);
  });
  return { entry, commits };
}

describe("fret entry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("holds a lone digit briefly in case a second follows, then commits it", () => {
    const { entry, commits } = setup();
    entry.push(note(0), 7);

    vi.advanceTimersByTime(199);
    expect(commits).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(commits).toEqual([[0, 0, 7]]);
  });

  it("commits two quick digits as one two-digit fret", () => {
    const { entry, commits } = setup();
    entry.push(note(0), 1);
    entry.push(note(0), 2);

    expect(commits).toEqual([[0, 0, 12]]);
    vi.advanceTimersByTime(1000);
    expect(commits).toEqual([[0, 0, 12]]);
  });

  it("splits a pair past the highest fret: the first now, the second after the wait", () => {
    const { entry, commits } = setup();
    entry.push(note(0), 3);
    entry.push(note(0), 5);

    expect(commits).toEqual([[0, 0, 3]]);
    vi.advanceTimersByTime(200);
    expect(commits).toEqual([
      [0, 0, 3],
      [0, 0, 5],
    ]);
  });

  it("commits a pending digit to its own note when the next digit is on another", () => {
    // Typing 1, moving right, typing 2 within the wait used to cancel the 1 and put 12
    // on the second note.
    const { entry, commits } = setup();
    entry.push(note(0), 1);
    entry.push(note(1), 2);

    expect(commits).toEqual([[0, 0, 1]]);
    vi.advanceTimersByTime(200);
    expect(commits).toEqual([
      [0, 0, 1],
      [1, 0, 2],
    ]);
  });

  it("treats another string of the same frame as another note", () => {
    const { entry, commits } = setup();
    entry.push(note(0, 0), 1);
    entry.push(note(0, 1), 2);
    vi.advanceTimersByTime(200);

    expect(commits).toEqual([
      [0, 0, 1],
      [0, 1, 2],
    ]);
  });

  it("flush commits the pending digit now, and nothing fires later", () => {
    const { entry, commits } = setup();
    entry.push(note(0), 4);
    entry.flush();

    expect(commits).toEqual([[0, 0, 4]]);
    vi.advanceTimersByTime(1000);
    expect(commits).toEqual([[0, 0, 4]]);
  });

  it("flush with nothing pending does nothing", () => {
    const { entry, commits } = setup();
    entry.flush();
    expect(commits).toEqual([]);
  });

  it("cancel drops the pending digit", () => {
    const { entry, commits } = setup();
    entry.push(note(0), 9);
    entry.cancel();

    vi.advanceTimersByTime(1000);
    expect(commits).toEqual([]);
  });

  it("starts fresh after a cancel", () => {
    const { entry, commits } = setup();
    entry.push(note(0), 1);
    entry.cancel();
    entry.push(note(0), 2);
    vi.advanceTimersByTime(200);

    // Not 12: the cancelled 1 is gone.
    expect(commits).toEqual([[0, 0, 2]]);
  });
});
