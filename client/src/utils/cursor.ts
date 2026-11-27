import type { MeasureType, TabBodyType } from "@tablab/shared";
import type { TabPositionType } from "../shared/types/utilities.types";
import { getMeasures, isExistingPosition } from "./tabOperations";

type FrameRef = { section: number; measure: number; frame: number };

/**
 * A way the cursor can move. `delta` is -1 for back (or up a string, toward the
 * highest-pitched) and 1 for forward (or down).
 */
export type CursorMotion =
  | { by: "frame"; delta: -1 | 1 }
  | { by: "measureStart"; delta: -1 | 1 }
  | { by: "string"; delta: -1 | 1 }
  | { to: FrameRef };

/**
 * Where the cursor lands after a motion through a Track's body.
 *
 * Frame and measure motions run through the whole Track in reading order, crossing
 * Measure and Section boundaries, and keep the string. Moving back a measure from partway
 * through one goes to the start of that measure first. Jumping `to` a frame keeps the
 * string too.
 *
 * When a motion has nowhere to go — the start or end of the Track, the top or bottom
 * string, a frame that doesn't exist — this returns `cursor` itself, so a caller can tell
 * that nothing moved.
 */
export function moveCursor(
  body: TabBodyType,
  cursor: TabPositionType,
  motion: CursorMotion,
  stringCount: number,
): TabPositionType {
  if (!("to" in motion) && motion.by === "string") {
    const string = cursor.string + motion.delta;
    return string < 0 || string >= stringCount ? cursor : { ...cursor, string };
  }

  const target =
    "to" in motion
      ? existing(body, motion.to)
      : motion.by === "frame"
        ? stepFrame(body, cursor, motion.delta)
        : stepMeasureStart(body, cursor, motion.delta);

  return target ? { ...target, string: cursor.string } : cursor;
}

function existing(body: TabBodyType, ref: FrameRef): FrameRef | null {
  return isExistingPosition(body, ref.section, ref.measure, ref.frame) ? ref : null;
}

function stepFrame(body: TabBodyType, at: FrameRef, delta: -1 | 1): FrameRef | null {
  const { section, measure, frame } = at;
  const within = existing(body, { section, measure, frame: frame + delta });
  if (within) return within;

  const measures = getMeasures(body, section);
  if (delta === 1) {
    if (measure + 1 < measures.length) return { section, measure: measure + 1, frame: 0 };
    return existing(body, { section: section + 1, measure: 0, frame: 0 });
  }

  if (measure > 0) {
    return { section, measure: measure - 1, frame: lastFrame(measures[measure - 1]) };
  }
  const previous = getMeasures(body, section - 1);
  if (previous.length === 0) return null;
  const last = previous.length - 1;
  return { section: section - 1, measure: last, frame: lastFrame(previous[last]) };
}

function stepMeasureStart(
  body: TabBodyType,
  at: FrameRef,
  delta: -1 | 1,
): FrameRef | null {
  const { section, measure, frame } = at;

  if (delta === 1) {
    if (measure + 1 < getMeasures(body, section).length) {
      return { section, measure: measure + 1, frame: 0 };
    }
    return existing(body, { section: section + 1, measure: 0, frame: 0 });
  }

  if (frame > 0) return { section, measure, frame: 0 };
  if (measure > 0) return { section, measure: measure - 1, frame: 0 };
  const previous = getMeasures(body, section - 1);
  if (previous.length === 0) return null;
  return { section: section - 1, measure: previous.length - 1, frame: 0 };
}

function lastFrame(measure: MeasureType): number {
  return Math.max(measure.frames.length - 1, 0);
}
