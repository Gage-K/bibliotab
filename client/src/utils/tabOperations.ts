import { nanoid } from "nanoid";
import type {
  TabBodyType,
  SectionType,
  MeasureType,
  FrameType,
  NoteFretType,
} from "../shared/types/tab.types"
import type { TabPositionType } from "../shared/types/utilities.types";
import {
  DEFAULT_FRAME_DURATION,
  DEFAULT_STRING_COUNT,
  FRET_EMPTY,
  MAX_FRAME_DURATION,
  MIN_FRAME_DURATION,
} from "../shared/types/consts";

export const DEFAULT_SECTION_NAME = "Section 1";

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
  return [createEmptyFrame(stringCount)];
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
    tab.sections[0]?.measures[0]?.[0]?.notes.length ?? DEFAULT_STRING_COUNT
  );
}

/**
 * Upgrades a legacy flat MeasureType[] body into the sectioned shape. Mirrors
 * normalizeTabBody in shared/utils/tab.serializer.ts — the server normalizes on read
 * and write, this catches anything cached client-side from before the migration.
 */
export function normalizeBody(
  raw: unknown,
  stringCount: number = DEFAULT_STRING_COUNT
): TabBodyType {
  if (Array.isArray(raw)) {
    return { sections: [createSection(DEFAULT_SECTION_NAME, raw as MeasureType[])] };
  }
  if (raw && typeof raw === "object" && Array.isArray((raw as TabBodyType).sections)) {
    return raw as TabBodyType;
  }
  return createEmptyBody(stringCount);
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
      measures: section.measures.map((measure) =>
        measure.map((frame) => ({
          ...frame,
          notes: Array.from({ length: stringCount }, (_unused, i) =>
            frame.notes[i] ?? { fret: FRET_EMPTY, style: "none" as const }
          ),
        }))
      ),
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
    : { ...measures[measure][frame], id: nanoid() };

  return measures.map((prevMeasure, i) =>
    i === measure
      ? [
          ...prevMeasure.slice(0, frame + 1),
          newFrame,
          ...prevMeasure.slice(frame + 1),
        ]
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
      ? prevMeasure.filter((_prevFrame, j) => j !== frame)
      : prevMeasure
  );
}

/**
 * Frame ids are stable anchors — playback highlighting and lyric mapping both key off
 * them — so editing a frame's notes keeps its id. Only insertFrameAt mints a new one.
 */
function updateFrameNotesAt(
  measures: MeasureType[],
  measure: number,
  frame: number,
  formData: NoteFretType[]
): MeasureType[] {
  return measures.map((prevMeasure, measureIndex) =>
    prevMeasure.map((prevFrame, frameIndex) =>
      frameIndex === frame && measureIndex === measure
        ? { ...prevFrame, notes: formData }
        : prevFrame
    )
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
  return tab.sections[section]?.measures[measure]?.[frame];
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
  return getMeasures(tab, section)[measure]?.length === 1;
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
      ordinal += measures[m].length;
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
  return mapSectionMeasures(tab, section, (measures) =>
    measures.map((prevMeasure, measureIndex) =>
      measureIndex !== measure
        ? prevMeasure
        : prevMeasure.map((prevFrame, frameIndex) =>
            frameIndex === frame ? { ...prevFrame, duration: clamped } : prevFrame
          )
    )
  );
}

/** Total beats in a measure — what a time signature is checked against. */
export function measureBeats(measure: MeasureType): number {
  return measure.reduce((sum, frame) => sum + frameDuration(frame), 0);
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
