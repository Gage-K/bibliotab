import { nanoid } from "nanoid";
import type {
  TabBodyType,
  SectionType,
  MeasureType,
  FrameType,
  NoteFretType,
  TimeSignatureType,
} from "../shared/types/tab.types"
import type { TabPositionType } from "../shared/types/utilities.types";
import {
  DEFAULT_FRAME_DURATION,
  DEFAULT_STRING_COUNT,
  FRET_EMPTY,
  MAX_FRAME_DURATION,
  MIN_FRAME_DURATION,
  NOTE_VALUES,
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
 * Upgrades a legacy flat MeasureType[] body into the sectioned shape. Mirrors
 * normalizeTabBody in shared/utils/tab.serializer.ts — the server normalizes on read
 * and write, this catches anything cached client-side from before the migration.
 */
export function normalizeBody(
  raw: unknown,
  stringCount: number = DEFAULT_STRING_COUNT
): TabBodyType {
  if (Array.isArray(raw)) {
    return {
      sections: [
        createSection(DEFAULT_SECTION_NAME, (raw as unknown[]).map(normalizeMeasure)),
      ],
    };
  }
  if (raw && typeof raw === "object" && Array.isArray((raw as TabBodyType).sections)) {
    const body = raw as TabBodyType;
    // Preserve the reference when nothing needs upgrading — callers rely on a
    // pass-through for already-current bodies. Only a legacy array-measure forces a copy.
    if (!bodyHasLegacyMeasures(body)) return body;
    return {
      sections: body.sections.map((section) => ({
        ...section,
        measures: (section.measures as unknown[]).map(normalizeMeasure),
      })),
    };
  }
  return createEmptyBody(stringCount);
}

/**
 * Upgrades a legacy `FrameType[]` measure into the `{ frames }` shape. A measure that is
 * already an object passes through unchanged. Mirrors the server's normalizeTabBody.
 */
export function normalizeMeasure(raw: unknown): MeasureType {
  if (Array.isArray(raw)) return { frames: raw as FrameType[] };
  if (raw && typeof raw === "object" && Array.isArray((raw as MeasureType).frames)) {
    return raw as MeasureType;
  }
  return { frames: [] };
}

/** True if any measure is still a bare `FrameType[]` (pre measure-object shape). */
function bodyHasLegacyMeasures(body: TabBodyType): boolean {
  return body.sections.some((section) =>
    (section.measures as unknown[]).some((measure) => Array.isArray(measure))
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
 * Frame ids are stable anchors — playback highlighting keys off them — so editing a
 * frame's notes keeps its id. Only insertFrameAt mints a new one.
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

/**
 * The next note value up or down from `current`, walking the editor's NOTE_VALUES
 * (whole → half → dotted quarter → quarter → eighth → sixteenth). Snaps an off-list
 * duration to its nearest value first, so stepping always lands on a real note value.
 * This is what the duration keyboard shortcuts step through.
 */
export function stepDuration(
  current: number,
  direction: "longer" | "shorter"
): number {
  const beats = NOTE_VALUES.map((value) => value.beats); // descending: [4, 2, 1.5, 1, …]
  let nearest = 0;
  let smallestGap = Infinity;
  beats.forEach((value, index) => {
    const gap = Math.abs(value - current);
    if (gap < smallestGap) {
      smallestGap = gap;
      nearest = index;
    }
  });
  // The list is longest-first, so a longer note is an earlier index.
  const next =
    direction === "longer"
      ? Math.max(0, nearest - 1)
      : Math.min(beats.length - 1, nearest + 1);
  return beats[next];
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

/**
 * Locates a frame by its id across every section of a body.
 *
 * Callers hold frame ids rather than indices (playback highlight, "go to frame"), so
 * resolving one means a scan. Returns null when the frame no longer exists — a stale id
 * goes inert rather than pointing somewhere wrong.
 */
export function findFrameById(
  tab: TabBodyType,
  frameId: string
): TabPositionType | null {
  for (let s = 0; s < tab.sections.length; s++) {
    const measures = tab.sections[s].measures;
    for (let m = 0; m < measures.length; m++) {
      const frames = measures[m].frames;
      for (let f = 0; f < frames.length; f++) {
        if (frames[f].id === frameId) {
          return { section: s, measure: m, frame: f, string: 0 };
        }
      }
    }
  }
  return null;
}

/** Every frame id in a body. */
export function collectFrameIds(tab: TabBodyType): Set<string> {
  const ids = new Set<string>();
  for (const section of tab.sections) {
    for (const measure of section.measures) {
      for (const frame of measure.frames) ids.add(frame.id);
    }
  }
  return ids;
}
