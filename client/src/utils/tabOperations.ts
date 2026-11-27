import { nanoid } from "nanoid";
import type { TabBodyType, SectionType, MeasureType, FrameType, NoteFretType, TimeSignatureType } from "@tablab/shared";
import type { TabPositionType } from "../shared/types/utilities.types";
import {
  DEFAULT_FRAME_DURATION,
  DEFAULT_SECTION_NAME,
  DEFAULT_STRING_COUNT,
  FRET_EMPTY,
  MAX_FRAME_DURATION,
  MIN_FRAME_DURATION,
  NOTE_VALUES,
} from "@tablab/shared";

/**
 * Three invariants hold everywhere below: a body has at least one section, a section
 * has at least one measure, and a measure has at least one frame. Operations that would
 * break them (deleting the last frame of a section's last measure, moving a section's
 * only measure away) are no-ops rather than errors, so the cursor is always valid.
 */

/** One note row per string; the string count comes from the tuning's length. */
export function createEmptyFrame(
  stringCount: number = DEFAULT_STRING_COUNT,
  duration: number = DEFAULT_FRAME_DURATION
): FrameType {
  return {
    id: nanoid(),
    notes: Array.from({ length: stringCount }, () => ({
      fret: FRET_EMPTY,
      style: "none" as const,
    })),
    duration,
  };
}

export function createEmptyMeasure(
  stringCount: number = DEFAULT_STRING_COUNT
): MeasureType {
  return { frames: [createEmptyFrame(stringCount)] };
}

export function createSection(
  name: string = DEFAULT_SECTION_NAME,
  measures?: MeasureType[],
  stringCount: number = DEFAULT_STRING_COUNT
): SectionType {
  return {
    id: nanoid(),
    name,
    measures: measures ?? [createEmptyMeasure(stringCount)],
  };
}

export function createEmptyBody(
  stringCount: number = DEFAULT_STRING_COUNT
): TabBodyType {
  return { sections: [createSection(DEFAULT_SECTION_NAME, undefined, stringCount)] };
}

/** String count a body was built for, read off its first frame. */
export function bodyStringCount(tab: TabBodyType): number {
  return (
    tab.sections[0]?.measures[0]?.frames[0]?.notes.length ?? DEFAULT_STRING_COUNT
  );
}

/**
 * Grows or shrinks every frame to `stringCount` rows, for when the tuning changes to
 * an instrument with a different number of strings. Added strings come in empty;
 * removed ones drop off the low end (the tail of the array), which is where the
 * tuning picker adds and removes them too.
 */
export function resizeFrames(
  tab: TabBodyType,
  stringCount: number
): TabBodyType {
  if (bodyStringCount(tab) === stringCount) return tab;
  return {
    ...tab,
    sections: tab.sections.map((section) => ({
      ...section,
      measures: section.measures.map((measure) => ({
        ...measure,
        frames: measure.frames.map((frame) => ({
          ...frame,
          notes: Array.from({ length: stringCount }, (_unused, i) =>
            frame.notes[i] ?? { fret: FRET_EMPTY, style: "none" as const }
          ),
        })),
      })),
    })),
  };
}

// ============================================================================
// Measure-level helpers — operate on a single section's MeasureType[]
// ============================================================================

function insertMeasureAt(
  measures: MeasureType[],
  measure: number,
  stringCount: number
): MeasureType[] {
  const newMeasure = createEmptyMeasure(stringCount);
  return measure === -1
    ? [newMeasure, ...measures]
    : [...measures.slice(0, measure), newMeasure, ...measures.slice(measure)];
}

function insertFrameAt(
  measures: MeasureType[],
  measure: number,
  frame: number,
  isEmpty: boolean,
  stringCount: number
): MeasureType[] {
  const newFrame = isEmpty
    ? createEmptyFrame(stringCount)
    : { ...measures[measure].frames[frame], id: nanoid() };

  return measures.map((prevMeasure, i) =>
    i === measure
      ? {
          ...prevMeasure,
          frames: [
            ...prevMeasure.frames.slice(0, frame + 1),
            newFrame,
            ...prevMeasure.frames.slice(frame + 1),
          ],
        }
      : prevMeasure
  );
}

function removeMeasureAt(measures: MeasureType[], measure: number): MeasureType[] {
  return measures.filter((_prevMeasure, index) => index !== measure);
}

function removeFrameAt(
  measures: MeasureType[],
  measure: number,
  frame: number
): MeasureType[] {
  return measures.map((prevMeasure, i) =>
    i === measure
      ? { ...prevMeasure, frames: prevMeasure.frames.filter((_f, j) => j !== frame) }
      : prevMeasure
  );
}

/**
 * Frame ids are stable — the display keys each frame by its id, so React keeps a frame's
 * element while it is edited or moved — so editing a frame's notes keeps its id. Only
 * insertFrameAt mints a new one.
 */
function updateFrameNotesAt(
  measures: MeasureType[],
  measure: number,
  frame: number,
  formData: NoteFretType[]
): MeasureType[] {
  return measures.map((prevMeasure, measureIndex) =>
    measureIndex !== measure
      ? prevMeasure
      : {
          ...prevMeasure,
          frames: prevMeasure.frames.map((prevFrame, frameIndex) =>
            frameIndex === frame ? { ...prevFrame, notes: formData } : prevFrame
          ),
        }
  );
}

// ============================================================================
// Section-aware wrappers — the API the reducer uses
// ============================================================================

/** Replaces one section's measures, leaving every other section identical. */
function mapSectionMeasures(
  tab: TabBodyType,
  section: number,
  fn: (measures: MeasureType[]) => MeasureType[]
): TabBodyType {
  if (!tab.sections[section]) return tab;
  return {
    ...tab,
    sections: tab.sections.map((prevSection, i) =>
      i === section ? { ...prevSection, measures: fn(prevSection.measures) } : prevSection
    ),
  };
}

export function getSection(tab: TabBodyType, section: number): SectionType | undefined {
  return tab.sections[section];
}

export function getMeasures(tab: TabBodyType, section: number): MeasureType[] {
  return tab.sections[section]?.measures ?? [];
}

export function getFrame(
  tab: TabBodyType,
  section: number,
  measure: number,
  frame: number
): FrameType | undefined {
  return tab.sections[section]?.measures[measure]?.frames[frame];
}

export function isExistingPosition(
  tab: TabBodyType,
  section: number,
  measure: number,
  frame: number
): boolean {
  return getFrame(tab, section, measure, frame) != undefined;
}

export function isOnlyFrame(
  tab: TabBodyType,
  section: number,
  measure: number
): boolean {
  return getMeasures(tab, section)[measure]?.frames.length === 1;
}

export function isOnlyMeasure(tab: TabBodyType, section: number): boolean {
  return getMeasures(tab, section).length === 1;
}

export function isOnlySection(tab: TabBodyType): boolean {
  return tab.sections.length === 1;
}

export function insertMeasure(
  tab: TabBodyType,
  section: number,
  measure: number,
  stringCount: number = bodyStringCount(tab)
): TabBodyType {
  return mapSectionMeasures(tab, section, (measures) =>
    insertMeasureAt(measures, measure, stringCount)
  );
}

export function insertFrame(
  tab: TabBodyType,
  section: number,
  measure: number,
  frame: number,
  isEmpty: boolean,
  stringCount: number = bodyStringCount(tab)
): TabBodyType {
  if (!getMeasures(tab, section)[measure]) return tab;
  return mapSectionMeasures(tab, section, (measures) =>
    insertFrameAt(measures, measure, frame, isEmpty, stringCount)
  );
}

export function removeMeasure(
  tab: TabBodyType,
  section: number,
  measure: number
): TabBodyType {
  return mapSectionMeasures(tab, section, (measures) =>
    removeMeasureAt(measures, measure)
  );
}

export function removeFrame(
  tab: TabBodyType,
  section: number,
  measure: number,
  frame: number
): TabBodyType {
  return mapSectionMeasures(tab, section, (measures) =>
    removeFrameAt(measures, measure, frame)
  );
}

export function updateFrameNotes(
  tab: TabBodyType,
  section: number,
  measure: number,
  frame: number,
  formData: NoteFretType[]
): TabBodyType {
  return mapSectionMeasures(tab, section, (measures) =>
    updateFrameNotesAt(measures, measure, frame, formData)
  );
}

export function resolvePositionAfterFrameDelete(
  tab: TabBodyType,
  section: number,
  measure: number,
  frame: number
): TabPositionType {
  if (isExistingPosition(tab, section, measure, frame)) {
    return { section, measure, frame, string: 0 };
  }
  if (isExistingPosition(tab, section, measure + 1, 0)) {
    return { section, measure: measure + 1, frame: 0, string: 0 };
  }
  return { section, measure, frame: frame - 1, string: 0 };
}

// ============================================================================
// Section operations
// ============================================================================

/** Clamps an insertion index into [0, length]; negative means "prepend". */
function clampInsertIndex(index: number, length: number): number {
  if (index < 0) return 0;
  return Math.min(index, length);
}

export function insertSection(
  tab: TabBodyType,
  index: number,
  name: string,
  stringCount: number = bodyStringCount(tab)
): TabBodyType {
  const at = clampInsertIndex(index, tab.sections.length);
  return {
    ...tab,
    sections: [
      ...tab.sections.slice(0, at),
      createSection(name, undefined, stringCount),
      ...tab.sections.slice(at),
    ],
  };
}

/** No-op on the last remaining section — a tab always has at least one. */
export function removeSection(tab: TabBodyType, index: number): TabBodyType {
  if (isOnlySection(tab) || !tab.sections[index]) return tab;
  return {
    ...tab,
    sections: tab.sections.filter((_section, i) => i !== index),
  };
}

export function renameSection(
  tab: TabBodyType,
  index: number,
  name: string
): TabBodyType {
  if (!tab.sections[index]) return tab;
  return {
    ...tab,
    sections: tab.sections.map((section, i) =>
      i === index ? { ...section, name } : section
    ),
  };
}

/**
 * Splices a measure out of one section and into another (or to a new index within the
 * same one). The target index is clamped, and the source keeping at least one measure
 * is enforced: moving a section's only measure to another section is a no-op.
 */
export function moveMeasure(
  tab: TabBodyType,
  from: { section: number; measure: number },
  to: { section: number; measure: number }
): TabBodyType {
  const source = tab.sections[from.section];
  const target = tab.sections[to.section];
  if (!source || !target) return tab;

  const moved = source.measures[from.measure];
  if (!moved) return tab;

  const sameSection = from.section === to.section;
  if (!sameSection && source.measures.length === 1) return tab;

  const sourceMeasures = removeMeasureAt(source.measures, from.measure);
  const targetMeasures = sameSection ? sourceMeasures : target.measures;
  const at = clampInsertIndex(to.measure, targetMeasures.length);
  const insertedMeasures = [
    ...targetMeasures.slice(0, at),
    moved,
    ...targetMeasures.slice(at),
  ];

  return {
    ...tab,
    sections: tab.sections.map((section, i) => {
      if (sameSection) {
        return i === from.section ? { ...section, measures: insertedMeasures } : section;
      }
      if (i === from.section) return { ...section, measures: sourceMeasures };
      if (i === to.section) return { ...section, measures: insertedMeasures };
      return section;
    }),
  };
}

/** Where a measure lands after moveMeasure — used to keep the cursor on it. */
export function resolveMoveTarget(
  tab: TabBodyType,
  from: { section: number; measure: number },
  to: { section: number; measure: number }
): { section: number; measure: number } {
  const sameSection = from.section === to.section;
  const lastIndex = sameSection
    ? getMeasures(tab, to.section).length - 1
    : getMeasures(tab, to.section).length;
  return {
    section: to.section,
    measure: clampInsertIndex(to.measure, Math.max(lastIndex, 0)),
  };
}

// ============================================================================
// Moving a run of frames
//
// A FrameRange is a contiguous block of frames inside one measure (a single frame when
// start === end). Nudging shifts it one position, hopping into the neighbouring measure
// at a bar edge; "to measure" relocates it wholesale. Each op returns the new body and
// where the block landed, so the caller can keep it selected.
// ============================================================================

export type FrameRange = {
  section: number;
  measure: number;
  start: number;
  end: number;
};

/** Replaces one measure's frames and reports the block's new range. */
function withMeasureFrames(
  tab: TabBodyType,
  section: number,
  measure: number,
  frames: FrameType[],
  range: FrameRange
): { tab: TabBodyType; range: FrameRange } {
  const next = {
    ...tab,
    sections: tab.sections.map((prevSection, s) =>
      s !== section
        ? prevSection
        : {
            ...prevSection,
            measures: prevSection.measures.map((prevMeasure, m) =>
              m === measure ? { ...prevMeasure, frames } : prevMeasure
            ),
          }
    ),
  };
  return { tab: next, range };
}

/**
 * Lifts the block out of its measure and drops it into `targetMeasure` (appended or
 * prepended). If the source measure is left empty it is removed — but never the section's
 * last measure. Returns the block's new range.
 */
function relocateBlock(
  tab: TabBodyType,
  range: FrameRange,
  targetMeasure: number,
  mode: "append" | "prepend"
): { tab: TabBodyType; range: FrameRange } {
  const section = tab.sections[range.section];
  if (!section) return { tab, range };
  const measures = section.measures;
  const source = measures[range.measure];
  const target = measures[targetMeasure];
  if (!source || !target) return { tab, range };

  const block = source.frames.slice(range.start, range.end + 1);
  const remaining = [
    ...source.frames.slice(0, range.start),
    ...source.frames.slice(range.end + 1),
  ];
  const targetLenBefore = target.frames.length;

  let newMeasures = measures.map((measure, m) => {
    if (m === range.measure) return { ...measure, frames: remaining };
    if (m === targetMeasure) {
      return {
        ...measure,
        frames: mode === "append" ? [...measure.frames, ...block] : [...block, ...measure.frames],
      };
    }
    return measure;
  });

  let landedMeasure = targetMeasure;
  const sourceEmptied = remaining.length === 0;
  if (sourceEmptied && newMeasures.length > 1) {
    newMeasures = newMeasures.filter((_measure, m) => m !== range.measure);
    if (range.measure < targetMeasure) landedMeasure = targetMeasure - 1;
  }

  const start = mode === "append" ? targetLenBefore : 0;
  const newRange: FrameRange = {
    section: range.section,
    measure: landedMeasure,
    start,
    end: start + block.length - 1,
  };

  return {
    tab: {
      ...tab,
      sections: tab.sections.map((prevSection, s) =>
        s === range.section ? { ...prevSection, measures: newMeasures } : prevSection
      ),
    },
    range: newRange,
  };
}

/**
 * Shifts a block one position left or right. Inside a measure it swaps with the single
 * adjacent frame; at the measure's edge it hops into the neighbouring measure (to that
 * measure's near end). A no-op — same tab and range — at the very start or end of a
 * section.
 */
export function nudgeFrameRange(
  tab: TabBodyType,
  range: FrameRange,
  direction: "left" | "right"
): { tab: TabBodyType; range: FrameRange } {
  const section = tab.sections[range.section];
  const measure = section?.measures[range.measure];
  if (!measure) return { tab, range };
  const frames = measure.frames;
  const { start, end } = range;
  if (start < 0 || end >= frames.length || start > end) return { tab, range };

  const block = frames.slice(start, end + 1);

  if (direction === "left") {
    if (start > 0) {
      const before = frames[start - 1];
      const newFrames = [
        ...frames.slice(0, start - 1),
        ...block,
        before,
        ...frames.slice(end + 1),
      ];
      return withMeasureFrames(tab, range.section, range.measure, newFrames, {
        ...range,
        start: start - 1,
        end: end - 1,
      });
    }
    if (range.measure > 0) {
      return relocateBlock(tab, range, range.measure - 1, "append");
    }
    return { tab, range };
  }

  if (end < frames.length - 1) {
    const after = frames[end + 1];
    const newFrames = [
      ...frames.slice(0, start),
      after,
      ...block,
      ...frames.slice(end + 2),
    ];
    return withMeasureFrames(tab, range.section, range.measure, newFrames, {
      ...range,
      start: start + 1,
      end: end + 1,
    });
  }
  if (range.measure < section.measures.length - 1) {
    return relocateBlock(tab, range, range.measure + 1, "prepend");
  }
  return { tab, range };
}

/**
 * Relocates a block to the previous or next measure in its section — to the end of the
 * previous measure, or the start of the next. A no-op at the section's first/last measure.
 */
export function moveFrameRangeToMeasure(
  tab: TabBodyType,
  range: FrameRange,
  delta: -1 | 1
): { tab: TabBodyType; range: FrameRange } {
  const section = tab.sections[range.section];
  if (!section) return { tab, range };
  const targetMeasure = range.measure + delta;
  if (targetMeasure < 0 || targetMeasure >= section.measures.length) {
    return { tab, range };
  }
  return relocateBlock(tab, range, targetMeasure, delta > 0 ? "prepend" : "append");
}

/**
 * Deletes the frames in a range. If that empties the measure it is removed (unless it is
 * the section's only measure, in which case the section is removed — or, for the last
 * section, the measure is reset to a single empty frame). Returns where the cursor should
 * land.
 */
export function deleteFrameRange(
  tab: TabBodyType,
  range: FrameRange
): { tab: TabBodyType; position: TabPositionType } {
  const fallback: TabPositionType = {
    section: range.section,
    measure: range.measure,
    frame: 0,
    string: 0,
  };
  const section = tab.sections[range.section];
  const measure = section?.measures[range.measure];
  if (!measure) return { tab, position: fallback };

  const remaining = [
    ...measure.frames.slice(0, range.start),
    ...measure.frames.slice(range.end + 1),
  ];

  if (remaining.length > 0) {
    const { tab: next } = withMeasureFrames(
      tab,
      range.section,
      range.measure,
      remaining,
      range
    );
    const frame = Math.min(range.start, remaining.length - 1);
    return {
      tab: next,
      position: { section: range.section, measure: range.measure, frame, string: 0 },
    };
  }

  // The measure is now empty.
  if (section.measures.length > 1) {
    const newMeasures = section.measures.filter((_measure, m) => m !== range.measure);
    const next = mapSectionMeasures(tab, range.section, () => newMeasures);
    const prevMeasure = Math.max(range.measure - 1, 0);
    const frame = Math.max(newMeasures[prevMeasure].frames.length - 1, 0);
    return {
      tab: next,
      position: { section: range.section, measure: prevMeasure, frame, string: 0 },
    };
  }

  if (tab.sections.length > 1) {
    const next = removeSection(tab, range.section);
    const newSection = Math.min(range.section, next.sections.length - 1);
    return { tab: next, position: { section: newSection, measure: 0, frame: 0, string: 0 } };
  }

  // The only measure of the only section: never leave the tab empty.
  const empty = createEmptyFrame(bodyStringCount(tab));
  const { tab: next } = withMeasureFrames(tab, range.section, range.measure, [empty], range);
  return { tab: next, position: fallback };
}

/**
 * Duplicates a range of frames, inserting fresh-id copies right after it. Returns the new
 * range covering the copies, so the caller can leave them selected.
 */
export function duplicateFrameRange(
  tab: TabBodyType,
  range: FrameRange
): { tab: TabBodyType; range: FrameRange } {
  const measure = tab.sections[range.section]?.measures[range.measure];
  if (!measure) return { tab, range };
  const block = measure.frames.slice(range.start, range.end + 1);
  if (block.length === 0) return { tab, range };

  const copies = block.map((frame) => ({ ...frame, id: nanoid() }));
  const newFrames = [
    ...measure.frames.slice(0, range.end + 1),
    ...copies,
    ...measure.frames.slice(range.end + 1),
  ];
  return withMeasureFrames(tab, range.section, range.measure, newFrames, {
    section: range.section,
    measure: range.measure,
    start: range.end + 1,
    end: range.end + copies.length,
  });
}

// ============================================================================
// Flattening — a single running index across every section
// ============================================================================

/**
 * Position of a frame in document order, counting every frame of every section before
 * it. Comparing ordinals makes selection ranges work across section boundaries.
 */
export function frameOrdinal(
  tab: TabBodyType,
  position: { section: number; measure: number; frame: number }
): number {
  let ordinal = 0;
  for (let s = 0; s < tab.sections.length; s++) {
    const measures = tab.sections[s].measures;
    for (let m = 0; m < measures.length; m++) {
      if (s === position.section && m === position.measure) {
        return ordinal + position.frame;
      }
      ordinal += measures[m].frames.length;
    }
  }
  return ordinal;
}

/** Total measures across all sections. */
export function totalMeasures(tab: TabBodyType): number {
  return tab.sections.reduce((sum, section) => sum + section.measures.length, 0);
}

/** 0-based index of a section's first measure in whole-tab measure numbering. */
export function sectionMeasureOffset(tab: TabBodyType, section: number): number {
  return tab.sections
    .slice(0, section)
    .reduce((sum, prevSection) => sum + prevSection.measures.length, 0);
}

// ============================================================================
// Rhythm
// ============================================================================

/** A frame's length in beats, defaulting for frames written before the rhythm model. */
export function frameDuration(frame: FrameType): number {
  return frame.duration ?? DEFAULT_FRAME_DURATION;
}

/** Whether a frame is a rest (silence for its duration). */
export function isRestFrame(frame: FrameType): boolean {
  return frame.isRest === true;
}

/** How much longer a dotted note is than its plain value. */
const DOT_FACTOR = 1.5;
const DURATION_EPSILON = 1e-6;

/** The plain note values, longest first: [4, 2, 1, 0.5, 0.25]. */
const BASE_NOTE_BEATS = NOTE_VALUES.map((value) => value.beats);

/** Whether a duration is a dotted note — a plain value times 1.5. */
export function isDottedDuration(beats: number): boolean {
  return BASE_NOTE_BEATS.some(
    (base) => Math.abs(base * DOT_FACTOR - beats) < DURATION_EPSILON
  );
}

/** The plain value under a duration — the note without its dot, if it has one. */
export function baseDuration(beats: number): number {
  return isDottedDuration(beats) ? beats / DOT_FACTOR : beats;
}

/**
 * Adds or removes a dot on a duration. Dotting a note makes it half again as long
 * (quarter → dotted quarter); removing the dot returns the plain value. Clamped so a
 * dotted whole note doesn't run past the duration ceiling.
 */
export function toggleDot(beats: number): number {
  if (isDottedDuration(beats)) return baseDuration(beats);
  return Math.min(MAX_FRAME_DURATION, beats * DOT_FACTOR);
}

/**
 * The next note value up or down from `current`, walking the plain note values
 * (whole → half → quarter → eighth → sixteenth). A dot is preserved across the step, so
 * a dotted quarter steps to a dotted eighth. Snaps an off-list duration to its nearest
 * value first. This is what the duration keyboard shortcuts step through.
 */
export function stepDuration(
  current: number,
  direction: "longer" | "shorter"
): number {
  const dotted = isDottedDuration(current);
  const base = baseDuration(current);

  let nearest = 0;
  let smallestGap = Infinity;
  BASE_NOTE_BEATS.forEach((value, index) => {
    const gap = Math.abs(value - base);
    if (gap < smallestGap) {
      smallestGap = gap;
      nearest = index;
    }
  });
  // The list is longest-first, so a longer note is an earlier index.
  const nextIndex =
    direction === "longer"
      ? Math.max(0, nearest - 1)
      : Math.min(BASE_NOTE_BEATS.length - 1, nearest + 1);

  const nextBase = BASE_NOTE_BEATS[nextIndex];
  return dotted ? Math.min(MAX_FRAME_DURATION, nextBase * DOT_FACTOR) : nextBase;
}

/** A measure's effective meter — its own override, or the tab default. */
export function measureTimeSignature(
  measure: MeasureType,
  fallback: TimeSignatureType
): TimeSignatureType {
  return measure.timeSignature ?? fallback;
}

export function setFrameDuration(
  tab: TabBodyType,
  section: number,
  measure: number,
  frame: number,
  duration: number
): TabBodyType {
  const clamped = Math.min(
    MAX_FRAME_DURATION,
    Math.max(MIN_FRAME_DURATION, duration)
  );
  return mapFrameInMeasure(tab, section, measure, frame, (prevFrame) => ({
    ...prevFrame,
    duration: clamped,
  }));
}

/**
 * Marks a frame as a rest (or clears the flag). A rest sounds nothing but keeps its
 * duration, so the bar's timing is unchanged. Setting the flag clears the frame's notes
 * so a rest never carries stray frets that would only confuse the display.
 */
export function setFrameRest(
  tab: TabBodyType,
  section: number,
  measure: number,
  frame: number,
  isRest: boolean,
  stringCount: number = bodyStringCount(tab)
): TabBodyType {
  return mapFrameInMeasure(tab, section, measure, frame, (prevFrame) =>
    isRest
      ? {
          ...prevFrame,
          isRest: true,
          notes: Array.from({ length: stringCount }, () => ({
            fret: FRET_EMPTY,
            style: "none" as const,
          })),
        }
      : { ...prevFrame, isRest: false }
  );
}

/** Sets this measure's meter override, or clears it (inherit the tab default). */
export function setMeasureTimeSignature(
  tab: TabBodyType,
  section: number,
  measure: number,
  timeSignature: TimeSignatureType | null
): TabBodyType {
  return mapSectionMeasures(tab, section, (measures) =>
    measures.map((prevMeasure, measureIndex) => {
      if (measureIndex !== measure) return prevMeasure;
      if (timeSignature === null) {
        const { timeSignature: _dropped, ...rest } = prevMeasure;
        return rest;
      }
      return { ...prevMeasure, timeSignature };
    })
  );
}

/** Replaces one frame within one measure, leaving everything else identical. */
function mapFrameInMeasure(
  tab: TabBodyType,
  section: number,
  measure: number,
  frame: number,
  fn: (frame: FrameType) => FrameType
): TabBodyType {
  return mapSectionMeasures(tab, section, (measures) =>
    measures.map((prevMeasure, measureIndex) =>
      measureIndex !== measure
        ? prevMeasure
        : {
            ...prevMeasure,
            frames: prevMeasure.frames.map((prevFrame, frameIndex) =>
              frameIndex === frame ? fn(prevFrame) : prevFrame
            ),
          }
    )
  );
}

/** Total beats in a measure — what a time signature is checked against. */
export function measureBeats(measure: MeasureType): number {
  return measure.frames.reduce((sum, frame) => sum + frameDuration(frame), 0);
}

/**
 * Whether a measure's frames add up to its meter. Used for a soft warning in the
 * display, not enforced — a tab in progress is allowed to be incomplete.
 */
export function measureIsComplete(
  measure: MeasureType,
  timeSignature: [number, number]
): boolean {
  const [beatsPerMeasure, beatValue] = timeSignature;
  // Durations are in quarter notes; a 6/8 measure is 3 quarter-note beats.
  const expected = beatsPerMeasure * (4 / beatValue);
  return Math.abs(measureBeats(measure) - expected) < 1e-6;
}
