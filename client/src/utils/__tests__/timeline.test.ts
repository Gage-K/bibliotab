import { describe, it, expect } from "vitest";
import {
  TICKS_PER_BEAT,
  barLineTicks,
  beatsToTicks,
  buildTimeGrid,
  buildTimelines,
  frameAtTick,
  secondsToTicks,
  timelineEnd,
} from "../timeline";
import { createTrack } from "../trackOperations";
import { createEmptyFrame, createSection } from "../tabOperations";
import type { TuningType } from "@/shared/types/tab.types";

function trackOf(name: string, durations: number[], tuning?: TuningType) {
  return createTrack({
    name,
    tuning,
    body: {
      sections: [
        createSection("Intro", [
          durations.map((duration) => ({
            ...createEmptyFrame(tuning?.length ?? 6),
            duration,
          })),
        ]),
      ],
    },
  });
}

describe("tick conversion", () => {
  it("divides a beat evenly for every common note value", () => {
    // 960 is chosen so eighths, triplets, sixteenths and dotted values are exact.
    expect(beatsToTicks(1)).toBe(TICKS_PER_BEAT);
    expect(beatsToTicks(0.5)).toBe(480);
    expect(beatsToTicks(0.25)).toBe(240);
    expect(beatsToTicks(1.5)).toBe(1440);
    expect(beatsToTicks(1 / 3)).toBe(320);
  });

  it("keeps summed eighths and a whole note exactly equal", () => {
    // Summing 0.5 eight times drifts in floats; in ticks it is exact, which is what
    // stops two tracks that should line up from landing a hair apart.
    const eighths = Array.from({ length: 8 }, () => beatsToTicks(0.5)).reduce(
      (a, b) => a + b,
      0,
    );
    expect(eighths).toBe(beatsToTicks(4));
  });
});

describe("buildTimeGrid", () => {
  it("lines up a guitar in eighths with a bass in quarters", () => {
    // The case index-alignment gets wrong: eight frames against four, same duration.
    const guitar = trackOf("Guitar", [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
    const bass = trackOf("Bass", [1, 1, 1, 1], ["G", "D", "A", "E"] as TuningType);

    const timelines = buildTimelines([guitar, bass]);
    const grid = buildTimeGrid(timelines);

    // Eight guitar onsets; the bass's four coincide with every other one.
    expect(grid).toEqual([0, 480, 960, 1440, 1920, 2400, 2880, 3360]);
    expect(timelines[1].frames.map((f) => f.startTick)).toEqual([0, 960, 1920, 2880]);
  });

  it("merges onsets rather than concatenating them", () => {
    const a = trackOf("A", [1, 1]);
    const b = trackOf("B", [1, 1]);
    expect(buildTimeGrid(buildTimelines([a, b]))).toEqual([0, 960]);
  });

  it("includes onsets unique to one track", () => {
    const a = trackOf("A", [1, 1]);
    const b = trackOf("B", [0.5, 0.5, 1]);
    expect(buildTimeGrid(buildTimelines([a, b]))).toEqual([0, 480, 960]);
  });

  it("measures the tab by its longest track", () => {
    const timelines = buildTimelines([trackOf("A", [1, 1]), trackOf("B", [1])]);
    expect(timelineEnd(timelines)).toBe(1920);
  });
});

describe("barLineTicks", () => {
  it("puts a line every four beats in 4/4", () => {
    expect(barLineTicks(beatsToTicks(8), [4, 4])).toEqual([0, 3840, 7680]);
  });

  it("counts a 6/8 bar as three quarter-note beats, not six", () => {
    expect(barLineTicks(beatsToTicks(6), [6, 8])).toEqual([0, 2880, 5760]);
  });

  it("handles 3/4", () => {
    expect(barLineTicks(beatsToTicks(6), [3, 4])).toEqual([0, 2880, 5760]);
  });
});

describe("frameAtTick", () => {
  const timeline = buildTimelines([trackOf("A", [1, 0.5, 2])])[0];

  it("finds the frame sounding at a moment", () => {
    expect(frameAtTick(timeline, 0)?.step).toBe(0);
    expect(frameAtTick(timeline, 959)?.step).toBe(0);
    expect(frameAtTick(timeline, 960)?.step).toBe(1);
  });

  it("holds a long note through later onsets in other tracks", () => {
    // The third frame runs two beats; a tick partway through still resolves to it.
    expect(frameAtTick(timeline, 1440)?.step).toBe(2);
    expect(frameAtTick(timeline, 3000)?.step).toBe(2);
  });

  it("returns null past the end of the track", () => {
    expect(frameAtTick(timeline, 10_000)).toBeNull();
  });
});

describe("secondsToTicks", () => {
  it("converts elapsed time at the tab's tempo", () => {
    // At 60 bpm one second is one beat.
    expect(secondsToTicks(1, 60)).toBe(TICKS_PER_BEAT);
    expect(secondsToTicks(1, 120)).toBe(TICKS_PER_BEAT * 2);
    expect(secondsToTicks(0, 90)).toBe(0);
  });
});
