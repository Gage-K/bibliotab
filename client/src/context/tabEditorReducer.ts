import type { TabBodyType, TrackType, NoteFretType, NoteStyleType, TimeSignatureType, TuningType } from "@tablab/shared";
import type { EditorDetailsType } from "../shared/types/utilities.types";
import type { TabPositionType, TabSelectionType } from "../shared/types/utilities.types";
import {
  isExistingPosition,
  isOnlyFrame,
  isOnlyMeasure,
  isOnlySection,
  getFrame,
  getMeasures,
  insertMeasure,
  insertFrame,
  removeMeasure,
  removeFrame,
  updateFrameNotes,
  setFrameDuration,
  setFrameRest,
  setMeasureTimeSignature,
  frameDuration,
  stepDuration,
  toggleDot,
  resolvePositionAfterFrameDelete,
  insertSection,
  removeSection,
  renameSection,
  moveMeasure,
  resolveMoveTarget,
  resizeFrames,
  nudgeFrameRange,
  moveFrameRangeToMeasure,
  deleteFrameRange,
  duplicateFrameRange,
  type FrameRange,
} from "../utils/tabOperations";
import { createTrack, trackStringCount } from "../utils/trackOperations";
import { moveCursor, type CursorMotion } from "../utils/cursor";
import {
  DEFAULT_BPM,
  DEFAULT_TIME_SIGNATURE,
  FRET_EMPTY,
  FRET_MUTED,
  MAX_BPM,
  MAX_TRACKS,
  MIN_BPM,
  reconcileOctaves,
} from "@tablab/shared";

export interface TabEditorState {
  /** Freeform markdown notes for the tab. */
  notes: string;
  tracks: TrackType[];
  /** Index into `tracks` — every edit applies to this one. */
  activeTrack: number;
  details: EditorDetailsType;
  position: TabPositionType;
  selection: TabSelectionType;
  editorIsOpen: boolean;
  isEditing: boolean;
  isSaving: boolean;
}

export const initialTabEditorState: TabEditorState = {
  notes: "",
  tracks: [],
  activeTrack: 0,
  details: {
    id: "",
    artist: "",
    song: "",
    bpm: DEFAULT_BPM,
    timeSignature: DEFAULT_TIME_SIGNATURE,
  },
  position: { section: 0, measure: 0, frame: 0, string: 0 },
  selection: null,
  editorIsOpen: false,
  isEditing: false,
  isSaving: false,
};

export type TabEditorAction =
  | {
      type: "SET_TAB_DATA";
      payload: {
        tracks: TrackType[];
        details: EditorDetailsType;
        notes: string;
      };
    }
  | { type: "SET_NOTES"; payload: { notes: string } }
  | { type: "UPDATE_DETAILS"; payload: { name: string; value: string } }
  | { type: "SET_BPM"; payload: { bpm: number } }
  | { type: "SET_TIME_SIGNATURE"; payload: { timeSignature: TimeSignatureType } }
  | {
      type: "SET_FRAME_DURATION";
      payload: { section: number; measure: number; frame: number; duration: number };
    }
  | {
      type: "SET_FRAME_REST";
      payload: { section: number; measure: number; frame: number; isRest: boolean };
    }
  | {
      type: "SET_MEASURE_TIME_SIGNATURE";
      payload: {
        section: number;
        measure: number;
        timeSignature: TimeSignatureType | null;
      };
    }
  | { type: "UPDATE_TAB_FRAME"; payload: { section: number; measure: number; frame: number; formData: NoteFretType[] } }
  | { type: "ADD_MEASURE"; payload: { section: number; measure: number } }
  | { type: "ADD_FRAME"; payload: { section: number; measure: number; frame: number; isEmpty: boolean } }
  | { type: "ADD_FRAME_AND_ADVANCE"; payload: { section: number; measure: number; frame: number; isEmpty: boolean } }
  | { type: "DELETE_FRAME"; payload: { section: number; measure: number; frame: number } }
  | { type: "MOVE_CURSOR"; payload: CursorMotion }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_NOTE_FRET"; payload: { section: number; measure: number; frame: number; string: number; fret: number } }
  /** Toggles a style on the note at the cursor. */
  | { type: "TOGGLE_NOTE_STYLE"; payload: { style: NoteStyleType } }
  /** Makes the frame at the cursor a note value longer or shorter, or toggles its dot. */
  | { type: "ADJUST_FRAME_DURATION"; payload: { adjust: "longer" | "shorter" | "dot" } }
  | { type: "EXTEND_SELECTION"; payload: { section: number; measure: number; frame: number } }
  | { type: "MOVE_FRAMES"; payload: { direction: "left" | "right" } }
  | { type: "MOVE_FRAMES_TO_MEASURE"; payload: { delta: -1 | 1 } }
  | { type: "DUPLICATE_FRAMES" }
  | { type: "ADD_SECTION"; payload: { index: number; name: string } }
  | { type: "RENAME_SECTION"; payload: { index: number; name: string } }
  | { type: "DELETE_SECTION"; payload: { index: number } }
  | {
      type: "MOVE_MEASURE";
      payload: {
        from: { section: number; measure: number };
        to: { section: number; measure: number };
      };
    }
  | { type: "SET_ACTIVE_TRACK"; payload: { index: number } }
  | {
      type: "ADD_TRACK";
      payload: { name: string; instrument: string; tuning: TuningType; octaves?: number[] };
    }
  | { type: "REMOVE_TRACK"; payload: { index: number } }
  | { type: "RENAME_TRACK"; payload: { index: number; name: string } }
  | {
      type: "SET_TRACK_TUNING";
      payload: {
        index: number;
        tuning: TuningType;
        instrument?: string;
        octaves?: number[];
      };
    }
  | { type: "TOGGLE_EDITOR" }
  | { type: "SAVE_START" }
  | { type: "SAVE_SUCCESS" }
  | { type: "SAVE_FAILURE" };

// ============================================================================
// Active-track accessors
//
// Every edit below goes through these rather than indexing
// tracks[activeTrack].body.sections[...] by hand: the path is long enough that
// repeating it invites drift, and bounds-checking belongs in one place.
// ============================================================================

const EMPTY_BODY: TabBodyType = { sections: [] };

export function activeTrack(state: TabEditorState): TrackType | undefined {
  return state.tracks[state.activeTrack];
}

/** The body being edited. Empty (not undefined) before the tab loads. */
export function activeBody(state: TabEditorState): TabBodyType {
  return activeTrack(state)?.body ?? EMPTY_BODY;
}

/** String count of the track being edited — its tuning is the source of truth. */
function stringCount(state: TabEditorState): number {
  return trackStringCount(activeTrack(state));
}

/** Replaces the active track's body, leaving every other track identical. */
function withBody(state: TabEditorState, body: TabBodyType): TabEditorState {
  return {
    ...state,
    tracks: state.tracks.map((track, i) =>
      i === state.activeTrack ? { ...track, body } : track
    ),
  };
}

/**
 * The block a move acts on: the selection when it sits within one measure, otherwise the
 * cursor's single frame. Cross-measure selections fall back to the single frame rather
 * than attempting a move whose shape isn't well defined.
 */
function currentRange(state: TabEditorState): FrameRange {
  const { selection, position } = state;
  if (
    selection &&
    selection.anchor.section === selection.head.section &&
    selection.anchor.measure === selection.head.measure
  ) {
    return {
      section: selection.anchor.section,
      measure: selection.anchor.measure,
      start: Math.min(selection.anchor.frame, selection.head.frame),
      end: Math.max(selection.anchor.frame, selection.head.frame),
    };
  }
  return {
    section: position.section,
    measure: position.measure,
    start: position.frame,
    end: position.frame,
  };
}

/** Applies a move result: re-selects the moved block and lands the cursor on its end. */
function stateAfterMove(
  state: TabEditorState,
  result: { tab: TabBodyType; range: FrameRange }
): TabEditorState {
  if (result.tab === activeBody(state)) return state;
  const { range } = result;
  const selection =
    range.end > range.start
      ? {
          anchor: { section: range.section, measure: range.measure, frame: range.start, string: 0 },
          head: { section: range.section, measure: range.measure, frame: range.end, string: 0 },
        }
      : null;
  return {
    ...withBody(state, result.tab),
    position: {
      section: range.section,
      measure: range.measure,
      frame: range.end,
      string: state.position.string,
    },
    selection,
    isEditing: true,
  };
}

/** Patches one track by index. */
function patchTrack(
  state: TabEditorState,
  index: number,
  patch: Partial<TrackType>
): TabEditorState {
  if (!state.tracks[index]) return state;
  return {
    ...state,
    tracks: state.tracks.map((track, i) =>
      i === index ? { ...track, ...patch } : track
    ),
  };
}

export function tabEditorReducer(state: TabEditorState, action: TabEditorAction): TabEditorState {
  switch (action.type) {
    case "SET_TAB_DATA":
      return {
        ...state,
        tracks: action.payload.tracks,
        activeTrack: 0,
        details: action.payload.details,
        notes: action.payload.notes,
        position: { section: 0, measure: 0, frame: 0, string: 0 },
        selection: null,
      };

    case "UPDATE_DETAILS":
      // Song and artist only — tuning belongs to a track (see SET_TRACK_TUNING).
      return {
        ...state,
        details: { ...state.details, [action.payload.name]: action.payload.value },
        isEditing: true,
      };

    case "SET_NOTES":
      if (action.payload.notes === state.notes) return state;
      return { ...state, notes: action.payload.notes, isEditing: true };

    case "SET_BPM": {
      const bpm = Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(action.payload.bpm)));
      if (bpm === state.details.bpm) return state;
      return { ...state, details: { ...state.details, bpm }, isEditing: true };
    }

    case "SET_TIME_SIGNATURE":
      return {
        ...state,
        details: { ...state.details, timeSignature: action.payload.timeSignature },
        isEditing: true,
      };

    case "SET_FRAME_DURATION": {
      const { section, measure, frame, duration } = action.payload;
      const newTab = setFrameDuration(activeBody(state), section, measure, frame, duration);
      if (newTab === activeBody(state)) return state;
      return { ...withBody(state, newTab), isEditing: true };
    }

    case "ADJUST_FRAME_DURATION": {
      const { section, measure, frame } = state.position;
      const current = getFrame(activeBody(state), section, measure, frame);
      if (!current) return state;
      const beats = frameDuration(current);
      const { adjust } = action.payload;
      const duration = adjust === "dot" ? toggleDot(beats) : stepDuration(beats, adjust);
      return tabEditorReducer(state, {
        type: "SET_FRAME_DURATION",
        payload: { section, measure, frame, duration },
      });
    }

    case "SET_FRAME_REST": {
      const { section, measure, frame, isRest } = action.payload;
      const newTab = setFrameRest(
        activeBody(state),
        section,
        measure,
        frame,
        isRest,
        stringCount(state)
      );
      if (newTab === activeBody(state)) return state;
      return { ...withBody(state, newTab), isEditing: true };
    }

    case "SET_MEASURE_TIME_SIGNATURE": {
      const { section, measure, timeSignature } = action.payload;
      const newTab = setMeasureTimeSignature(activeBody(state), section, measure, timeSignature);
      if (newTab === activeBody(state)) return state;
      return { ...withBody(state, newTab), isEditing: true };
    }

    case "UPDATE_TAB_FRAME":
      return {
        ...withBody(
          state,
          updateFrameNotes(
            activeBody(state),
          action.payload.section,
          action.payload.measure,
            action.payload.frame,
            action.payload.formData
          )
        ),
        isEditing: true,
      };

    case "ADD_MEASURE": {
      const { section, measure } = action.payload;
      const newTab = insertMeasure(activeBody(state), section, measure, stringCount(state));
      return {
        ...withBody(state, newTab),
        position: { section, measure: measure === -1 ? 0 : measure, frame: 0, string: 0 },
        isEditing: true,
      };
    }

    case "ADD_FRAME": {
      const { section, measure, frame, isEmpty } = action.payload;
      return {
        ...withBody(
          state,
          insertFrame(activeBody(state), section, measure, frame, isEmpty, stringCount(state))
        ),
        isEditing: true,
      };
    }

    case "ADD_FRAME_AND_ADVANCE": {
      const { section, measure, frame, isEmpty } = action.payload;
      const newTab = insertFrame(
        activeBody(state),
        section,
        measure,
        frame,
        isEmpty,
        stringCount(state)
      );
      const newPosition = isExistingPosition(newTab, section, measure, frame + 1)
        ? { section, measure, frame: frame + 1, string: state.position.string }
        : state.position;
      return {
        ...withBody(state, newTab),
        position: newPosition,
        isEditing: true,
      };
    }

    case "DELETE_FRAME": {
      // A multi-frame selection deletes the whole run in one go.
      const range = currentRange(state);
      if (range.end > range.start) {
        const result = deleteFrameRange(activeBody(state), range);
        if (result.tab === activeBody(state)) return state;
        return {
          ...withBody(state, result.tab),
          position: result.position,
          selection: null,
          isEditing: true,
        };
      }

      const { section, measure, frame } = action.payload;

      if (isOnlyFrame(activeBody(state), section, measure)) {
        // A section always keeps at least one measure; empty it out via DELETE_SECTION.
        if (isOnlyMeasure(activeBody(state), section)) {
          return state;
        }
        const newTab = removeMeasure(activeBody(state), section, measure);
        const prevMeasure = Math.max(measure - 1, 0);
        return {
          ...withBody(state, newTab),
          position: {
            section,
            measure: prevMeasure,
            frame: getMeasures(newTab, section)[prevMeasure]?.frames.length - 1 || 0,
            string: 0,
          },
          isEditing: true,
        };
      }

      const newTab = removeFrame(activeBody(state), section, measure, frame);
      return {
        ...withBody(state, newTab),
        position: resolvePositionAfterFrameDelete(newTab, section, measure, frame),
        isEditing: true,
      };
    }

    case "MOVE_CURSOR": {
      const motion = action.payload;
      const position = moveCursor(activeBody(state), state.position, motion, stringCount(state));
      if (position === state.position) return state;
      // A selection spans frames, so moving along the strings keeps it; any other move
      // (including a click on the current frame) ends it.
      const keepsSelection = "by" in motion && motion.by === "string";
      return { ...state, position, selection: keepsSelection ? state.selection : null };
    }

    case "CLEAR_SELECTION":
      return state.selection === null ? state : { ...state, selection: null };

    case "SET_NOTE_FRET": {
      const { section, measure, frame, string: stringIdx, fret } = action.payload;
      const currentFrame = getFrame(activeBody(state), section, measure, frame);
      if (!currentFrame) return state;
      const newNotes = currentFrame.notes.map((note, i) =>
        i === stringIdx
          ? {
              ...note,
              fret,
              // An empty or muted string carries no style.
              ...(fret === FRET_EMPTY || fret === FRET_MUTED ? { style: "none" as const } : {}),
            }
          : note
      );
      return {
        ...withBody(
          state,
          updateFrameNotes(activeBody(state), section, measure, frame, newNotes)
        ),
        isEditing: true,
      };
    }

    // The keyboard's edits act on the cursor as it is in state, never as last drawn: a
    // fret typed a moment earlier is already here, even if the screen hasn't caught up.
    case "TOGGLE_NOTE_STYLE": {
      const { section, measure, frame, string: stringIdx } = state.position;
      const currentFrame = getFrame(activeBody(state), section, measure, frame);
      if (!currentFrame) return state;
      const note = currentFrame.notes[stringIdx];
      // Only a fretted note can be bent, slid, and so on.
      if (!note || note.fret === FRET_EMPTY || note.fret === FRET_MUTED) return state;
      const style = note.style === action.payload.style ? "none" : action.payload.style;
      const newNotes = currentFrame.notes.map((n, i) =>
        i === stringIdx ? { ...n, style } : n
      );
      return {
        ...withBody(
          state,
          updateFrameNotes(activeBody(state), section, measure, frame, newNotes)
        ),
        isEditing: true,
      };
    }

    case "EXTEND_SELECTION": {
      const { section, measure, frame } = action.payload;
      const tab = activeBody(state);
      if (!isExistingPosition(tab, section, measure, frame)) return state;

      const newPosition = { ...state.position, section, measure, frame };
      const head = { section, measure, frame, string: 0 };
      if (state.selection) {
        return {
          ...state,
          position: newPosition,
          selection: { ...state.selection, head },
        };
      }
      return {
        ...state,
        position: newPosition,
        selection: {
          anchor: { ...state.position },
          head,
        },
      };
    }

    case "MOVE_FRAMES":
      return stateAfterMove(
        state,
        nudgeFrameRange(activeBody(state), currentRange(state), action.payload.direction)
      );

    case "MOVE_FRAMES_TO_MEASURE":
      return stateAfterMove(
        state,
        moveFrameRangeToMeasure(activeBody(state), currentRange(state), action.payload.delta)
      );

    case "DUPLICATE_FRAMES":
      // Duplicates the selection (or the cursor's frame) and leaves the copies selected.
      return stateAfterMove(
        state,
        duplicateFrameRange(activeBody(state), currentRange(state))
      );

    case "ADD_SECTION": {
      const { index, name } = action.payload;
      const newTab = insertSection(activeBody(state), index, name, stringCount(state));
      if (newTab === activeBody(state)) return state;
      const newSection = Math.max(Math.min(index, newTab.sections.length - 1), 0);
      return {
        ...withBody(state, newTab),
        position: { section: newSection, measure: 0, frame: 0, string: state.position.string },
        selection: null,
        isEditing: true,
      };
    }

    case "RENAME_SECTION": {
      const newTab = renameSection(activeBody(state), action.payload.index, action.payload.name);
      if (newTab === activeBody(state)) return state;
      return { ...withBody(state, newTab), isEditing: true };
    }

    case "DELETE_SECTION": {
      const { index } = action.payload;
      if (isOnlySection(activeBody(state))) return state;
      const newTab = removeSection(activeBody(state), index);
      if (newTab === activeBody(state)) return state;

      // Deleting a section the cursor isn't in leaves the cursor on the same frame,
      // shifted if the deletion was above it. Deleting the cursor's own section lands
      // on whichever section took its place (or the new last one).
      if (state.position.section !== index) {
        const shifted =
          state.position.section > index
            ? state.position.section - 1
            : state.position.section;
        return {
          ...withBody(state, newTab),
          position: { ...state.position, section: shifted },
          selection: null,
          isEditing: true,
        };
      }

      const newSection = Math.min(index, newTab.sections.length - 1);
      return {
        ...withBody(state, newTab),
        position: { section: newSection, measure: 0, frame: 0, string: 0 },
        selection: null,
        isEditing: true,
      };
    }

    case "MOVE_MEASURE": {
      const { from, to } = action.payload;
      const newTab = moveMeasure(activeBody(state), from, to);
      if (newTab === activeBody(state)) return state;

      const landed = resolveMoveTarget(activeBody(state), from, to);
      return {
        ...withBody(state, newTab),
        position: { ...landed, frame: 0, string: state.position.string },
        selection: null,
        isEditing: true,
      };
    }

    case "SET_ACTIVE_TRACK": {
      const { index } = action.payload;
      if (!state.tracks[index] || index === state.activeTrack) return state;
      // Positions are per-track, so switching resets rather than carrying an index
      // that may not exist in the new track.
      return {
        ...state,
        activeTrack: index,
        position: { section: 0, measure: 0, frame: 0, string: 0 },
        selection: null,
      };
    }

    case "ADD_TRACK": {
      const { name, instrument, tuning, octaves } = action.payload;
      if (state.tracks.length >= MAX_TRACKS) return state;
      const track = createTrack({ name, instrument, tuning, octaves });
      return {
        ...state,
        tracks: [...state.tracks, track],
        activeTrack: state.tracks.length,
        position: { section: 0, measure: 0, frame: 0, string: 0 },
        selection: null,
        isEditing: true,
      };
    }

    case "REMOVE_TRACK": {
      const { index } = action.payload;
      // A tab always has at least one track — there would be nothing to edit.
      if (state.tracks.length === 1 || !state.tracks[index]) return state;

      const tracks = state.tracks.filter((_track, i) => i !== index);
      const activeTrack =
        state.activeTrack > index
          ? state.activeTrack - 1
          : Math.min(state.activeTrack, tracks.length - 1);

      return {
        ...state,
        tracks,
        activeTrack,
        position:
          state.activeTrack === index
            ? { section: 0, measure: 0, frame: 0, string: 0 }
            : state.position,
        selection: null,
        isEditing: true,
      };
    }

    case "RENAME_TRACK": {
      const next = patchTrack(state, action.payload.index, { name: action.payload.name });
      if (next === state) return state;
      return { ...next, isEditing: true };
    }

    case "SET_TRACK_TUNING": {
      const { index, tuning, instrument, octaves } = action.payload;
      const track = state.tracks[index];
      if (!track) return state;

      // Switching to an instrument with a different string count has to reshape every
      // frame, or the notes array and the tuning disagree about how many rows exist.
      const newStringCount = tuning.length;
      const next = patchTrack(state, index, {
        tuning,
        octaves: octaves ?? reconcileOctaves(tuning, track.octaves),
        ...(instrument ? { instrument } : {}),
        body: resizeFrames(track.body, newStringCount),
      });

      if (index !== state.activeTrack) return { ...next, isEditing: true };

      return {
        ...next,
        position: {
          ...state.position,
          string: Math.min(state.position.string, newStringCount - 1),
        },
        selection: null,
        isEditing: true,
      };
    }

    case "TOGGLE_EDITOR":
      return { ...state, editorIsOpen: !state.editorIsOpen };

    case "SAVE_START":
      return { ...state, isSaving: true };

    case "SAVE_SUCCESS":
      return { ...state, isSaving: false, isEditing: false };

    case "SAVE_FAILURE":
      return { ...state, isSaving: false };

    default:
      return state;
  }
}
