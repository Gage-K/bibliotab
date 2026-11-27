import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type Dispatch,
} from "react";
import { useTab, useUpdateTab } from "../hooks/useTabs";
import { useEditorKeybindings } from "../hooks/useEditorKeybindings";
import type { EditorAction } from "../shared/keymaps/defaultKeymap";
import type {
  NoteFretType,
  TabBodyType,
  TimeSignatureType,
  TrackType,
  TuningType,
} from "@tablab/shared";
import { FRET_EMPTY, FRET_MUTED, normalizeTabTracks } from "@tablab/shared";
import type {
  EditorDetailsType,
  TabPositionType,
  TabSelectionType,
} from "../shared/types/utilities.types";
import {
  tabEditorReducer,
  initialTabEditorState,
  activeBody,
  type TabEditorAction,
} from "./tabEditorReducer";
import { trackStringCount } from "../utils/trackOperations";
import { createFretEntry } from "../utils/fretEntry";
import type { CursorMotion } from "../utils/cursor";
import { useTabPlayback } from "../hooks/useTabPlayback";

type MeasureRef = { section: number; measure: number };

/**
 * The edits the editor offers its components. Each one only dispatches, so the object is
 * built once per editor and never changes. Adding an edit is one entry here plus its
 * case in the reducer.
 */
function createCommands(dispatch: Dispatch<TabEditorAction>) {
  return {
    /** Song or artist. Tuning belongs to a track: see setTrackTuning. */
    updateDetails: (name: string, value: string) =>
      dispatch({ type: "UPDATE_DETAILS", payload: { name, value } }),
    setNotes: (notes: string) => dispatch({ type: "SET_NOTES", payload: { notes } }),
    setBpm: (bpm: number) => dispatch({ type: "SET_BPM", payload: { bpm } }),
    setTimeSignature: (timeSignature: TimeSignatureType) =>
      dispatch({ type: "SET_TIME_SIGNATURE", payload: { timeSignature } }),

    /**
     * Moves the cursor: a frame, measure, or string at a time (crossing measure and
     * section boundaries), or straight to a frame. See utils/cursor.
     */
    moveCursor: (motion: CursorMotion) => dispatch({ type: "MOVE_CURSOR", payload: motion }),

    updateTabData: (section: number, measure: number, frame: number, formData: NoteFretType[]) =>
      dispatch({ type: "UPDATE_TAB_FRAME", payload: { section, measure, frame, formData } }),
    setFrameDuration: (section: number, measure: number, frame: number, duration: number) =>
      dispatch({ type: "SET_FRAME_DURATION", payload: { section, measure, frame, duration } }),
    setFrameRest: (section: number, measure: number, frame: number, isRest: boolean) =>
      dispatch({ type: "SET_FRAME_REST", payload: { section, measure, frame, isRest } }),
    /** A meter for one measure, or null to inherit the tab's. */
    setMeasureTimeSignature: (
      section: number,
      measure: number,
      timeSignature: TimeSignatureType | null,
    ) =>
      dispatch({ type: "SET_MEASURE_TIME_SIGNATURE", payload: { section, measure, timeSignature } }),

    /** Inserts a frame after `frame` and moves the cursor onto it. */
    addFrameAndAdvance: (section: number, measure: number, frame: number, isEmpty: boolean) =>
      dispatch({ type: "ADD_FRAME_AND_ADVANCE", payload: { section, measure, frame, isEmpty } }),
    /** Duplicates the selection, or the cursor's frame when nothing is selected. */
    duplicateFrames: () => dispatch({ type: "DUPLICATE_FRAMES" }),
    /** Deletes the selection, or this frame when nothing is selected. */
    deleteFrame: (section: number, measure: number, frame: number) =>
      dispatch({ type: "DELETE_FRAME", payload: { section, measure, frame } }),
    /** Inserts an empty measure at index `measure` of the section. */
    addNewMeasure: (section: number, measure: number) =>
      dispatch({ type: "ADD_MEASURE", payload: { section, measure } }),
    moveMeasure: (from: MeasureRef, to: MeasureRef) =>
      dispatch({ type: "MOVE_MEASURE", payload: { from, to } }),

    addSection: (index: number, name: string) =>
      dispatch({ type: "ADD_SECTION", payload: { index, name } }),
    renameSection: (index: number, name: string) =>
      dispatch({ type: "RENAME_SECTION", payload: { index, name } }),
    deleteSection: (index: number) => dispatch({ type: "DELETE_SECTION", payload: { index } }),

    setActiveTrack: (index: number) => dispatch({ type: "SET_ACTIVE_TRACK", payload: { index } }),
    addTrack: (options: {
      name: string;
      instrument: string;
      tuning: TuningType;
      octaves?: number[];
    }) => dispatch({ type: "ADD_TRACK", payload: options }),
    removeTrack: (index: number) => dispatch({ type: "REMOVE_TRACK", payload: { index } }),
    renameTrack: (index: number, name: string) =>
      dispatch({ type: "RENAME_TRACK", payload: { index, name } }),
    setTrackTuning: (
      index: number,
      tuning: TuningType,
      options?: { instrument?: string; octaves?: number[] },
    ) => dispatch({ type: "SET_TRACK_TUNING", payload: { index, tuning, ...options } }),

    handleOpeningEditor: () => dispatch({ type: "TOGGLE_EDITOR" }),
  };
}

interface TabEditorContextType extends ReturnType<typeof createCommands> {
  /** The active track's body — what the tab display and editing actions operate on. */
  tab: TabBodyType;
  tracks: TrackType[];
  activeTrack: number;
  /** The track being edited, or undefined before the tab loads. */
  track: TrackType | undefined;
  details: EditorDetailsType;
  notes: string;
  isLoading: boolean;
  position: TabPositionType;
  selection: TabSelectionType;
  editorIsOpen: boolean;
  isEditing: boolean;
  isSaving: boolean;
  isDemo: boolean;
  /** Number of strings on the current instrument — the tuning's length. */
  stringCount: number;
  isPlaying: boolean;
  togglePlayback: () => void;
  /** Frames in the longest track — zero means there is nothing to play. */
  totalSteps: number;
  saveChanges: () => Promise<void>;
}

const TabEditorContext = createContext<TabEditorContextType | null>(null);

const FRET_DIGIT_PREFIX = "fretDigit";

/** The digit a number-key action stands for, or null for any other action. */
function fretDigit(action: EditorAction): number | null {
  return action.startsWith(FRET_DIGIT_PREFIX)
    ? Number(action.slice(FRET_DIGIT_PREFIX.length))
    : null;
}

export function TabEditorProvider({
  tabId,
  demoData,
  children,
}: {
  tabId?: string;
  demoData?: {
    tracks: TrackType[];
    details: EditorDetailsType;
    notes?: string;
  };
  children: React.ReactNode;
}) {
  const isDemo = !!demoData;
  const [state, dispatch] = useReducer(tabEditorReducer, initialTabEditorState);
  const [commands] = useState(() => createCommands(dispatch));
  const {
    tracks,
    activeTrack,
    details,
    notes,
    position,
    selection,
    editorIsOpen,
    isEditing,
    isSaving,
  } = state;

  const track = tracks[activeTrack];
  const tab = activeBody(state);

  const { data: serverTab, isLoading: isQueryLoading } = useTab(tabId ?? "", { enabled: !isDemo && !!tabId });
  const updateTabMutation = useUpdateTab(tabId ?? "");

  const hasLoaded = useRef(false);
  useEffect(() => {
    if (demoData && !hasLoaded.current) {
      hasLoaded.current = true;
      dispatch({
        type: "SET_TAB_DATA",
        payload: {
          ...demoData,
          notes: demoData.notes ?? "",
          tracks: normalizeTabTracks({ tracks: demoData.tracks }).tracks,
        },
      });
    } else if (serverTab && !hasLoaded.current) {
      hasLoaded.current = true;
      dispatch({
        type: "SET_TAB_DATA",
        payload: {
          details: {
            id: serverTab.id,
            artist: serverTab.details.artist,
            song: serverTab.details.song,
            bpm: serverTab.details.bpm,
            timeSignature: serverTab.details.timeSignature,
          },
          // The server already normalizes, but a response cached from an older client
          // can still be a pre-tracks shape. normalizeTabTracks is the same function the
          // server reads with, so both sides upgrade old shapes identically.
          tracks: normalizeTabTracks({ tracks: serverTab.tracks }).tracks,
          notes: serverTab.notes ?? "",
        },
      });
    }
  }, [serverTab, demoData]);

  const isLoading = isDemo ? false : isQueryLoading || tracks.length === 0;
  const stringCount = trackStringCount(track);

  async function saveChanges() {
    if (isDemo) return;
    dispatch({ type: "SAVE_START" });
    const data = {
      tab_name: details.song,
      tab_artist: details.artist,
      tab_data: { tracks },
      bpm: details.bpm,
      time_signature: details.timeSignature,
      notes,
    };

    updateTabMutation.mutate(data, {
      onSuccess: () => {
        dispatch({ type: "SAVE_SUCCESS" });
      },
      onError: (err) => {
        console.error(err);
        dispatch({ type: "SAVE_FAILURE" });
      },
    });
  }

  // ==========================================================================
  // Playback
  //
  // Lives here rather than in the transport component because two consumers need it:
  // the transport button and the timeline's playhead.
  // ==========================================================================
  const handlePlaybackStep = useCallback(
    (step: TabPositionType) => {
      commands.moveCursor({
        to: { section: step.section, measure: step.measure, frame: step.frame },
      });
    },
    [commands],
  );

  const {
    isPlaying,
    toggle: togglePlayback,
    totalSteps,
  } = useTabPlayback({
    tracks,
    activeTrack,
    bpm: details.bpm,
    onStep: handlePlaybackStep,
  });

  // Fret entry from the number keys. One instance for the provider's life: a held digit
  // outlives renders, and committing only needs the stable `dispatch`.
  const [fretEntry] = useState(() =>
    createFretEntry((target, fret) => {
      dispatch({ type: "SET_NOTE_FRET", payload: { ...target, fret } });
    })
  );
  // A held digit must not commit into an editor that has gone away.
  useEffect(() => () => fretEntry.cancel(), [fretEntry]);

  // The keyboard. Edits that depend on what is under the cursor (styles, durations) are
  // decided by the reducer, which sees state as it is now rather than as last drawn.
  const handleEditorAction = useCallback(
    (action: EditorAction) => {
      const { section, measure, frame } = position;

      const digit = fretDigit(action);
      if (digit !== null) {
        fretEntry.push(position, digit);
        return;
      }
      // Settle a held digit before anything else, so edits land in the order they were
      // typed (a quick `1` then `m` ends muted, not on fret 1). Escape abandons it.
      if (action === "escape") fretEntry.cancel();
      else fretEntry.flush();

      const { moveCursor } = commands;
      switch (action) {
        // Navigation
        case "moveUp":
          moveCursor({ by: "string", delta: -1 });
          break;
        case "moveDown":
          moveCursor({ by: "string", delta: 1 });
          break;
        case "moveLeft":
          moveCursor({ by: "frame", delta: -1 });
          break;
        case "moveRight":
          moveCursor({ by: "frame", delta: 1 });
          break;
        case "nextMeasureStart":
          moveCursor({ by: "measureStart", delta: 1 });
          break;
        case "prevMeasureStart":
          moveCursor({ by: "measureStart", delta: -1 });
          break;

        // Selection
        case "selectLeft":
          dispatch({
            type: "EXTEND_SELECTION",
            payload: { section, measure, frame: frame - 1 },
          });
          break;
        case "selectRight":
          dispatch({
            type: "EXTEND_SELECTION",
            payload: { section, measure, frame: frame + 1 },
          });
          break;

        // Note operations
        case "clearNote":
          dispatch({ type: "SET_NOTE_FRET", payload: { ...position, fret: FRET_EMPTY } });
          break;
        case "muteNote":
          dispatch({ type: "SET_NOTE_FRET", payload: { ...position, fret: FRET_MUTED } });
          break;

        // Styles
        case "styleBend":
          dispatch({ type: "TOGGLE_NOTE_STYLE", payload: { style: "bend" } });
          break;
        case "styleSlide":
          dispatch({ type: "TOGGLE_NOTE_STYLE", payload: { style: "slide" } });
          break;
        case "styleHammerOn":
          dispatch({ type: "TOGGLE_NOTE_STYLE", payload: { style: "hammerOn" } });
          break;
        case "stylePullOff":
          dispatch({ type: "TOGGLE_NOTE_STYLE", payload: { style: "pullOff" } });
          break;
        case "styleHarmonic":
          dispatch({ type: "TOGGLE_NOTE_STYLE", payload: { style: "harmonic" } });
          break;
        case "styleTap":
          dispatch({ type: "TOGGLE_NOTE_STYLE", payload: { style: "tap" } });
          break;

        // Inserts
        case "addFrameBefore":
          dispatch({ type: "ADD_FRAME", payload: { section, measure, frame: frame - 1, isEmpty: true } });
          // Stay on the frame we were on, now one further along.
          moveCursor({ to: { section, measure, frame: frame + 1 } });
          break;
        case "addFrameAfter":
          dispatch({ type: "ADD_FRAME", payload: { section, measure, frame, isEmpty: true } });
          break;
        case "duplicateFrame":
          dispatch({ type: "DUPLICATE_FRAMES" });
          break;
        case "addMeasureBefore":
          dispatch({ type: "ADD_MEASURE", payload: { section, measure } });
          // Stay on the frame we were on, in its measure now one further along.
          moveCursor({ to: { section, measure: measure + 1, frame } });
          break;
        case "addMeasureAfter":
          dispatch({ type: "ADD_MEASURE", payload: { section, measure: measure + 1 } });
          break;

        case "deleteFrame":
          dispatch({ type: "DELETE_FRAME", payload: { section, measure, frame } });
          break;

        // Duration — step the cursor's frame through the editor's note values.
        case "durationLonger":
          dispatch({ type: "ADJUST_FRAME_DURATION", payload: { adjust: "longer" } });
          break;
        case "durationShorter":
          dispatch({ type: "ADJUST_FRAME_DURATION", payload: { adjust: "shorter" } });
          break;
        case "toggleDot":
          dispatch({ type: "ADJUST_FRAME_DURATION", payload: { adjust: "dot" } });
          break;

        // Moving a run of frames (or the current frame when nothing is selected).
        case "moveFramesLeft":
          dispatch({ type: "MOVE_FRAMES", payload: { direction: "left" } });
          break;
        case "moveFramesRight":
          dispatch({ type: "MOVE_FRAMES", payload: { direction: "right" } });
          break;
        case "moveFramesToPrevMeasure":
          dispatch({ type: "MOVE_FRAMES_TO_MEASURE", payload: { delta: -1 } });
          break;
        case "moveFramesToNextMeasure":
          dispatch({ type: "MOVE_FRAMES_TO_MEASURE", payload: { delta: 1 } });
          break;

        case "escape":
          dispatch({ type: "CLEAR_SELECTION" });
          break;
      }
    },
    [position, fretEntry, commands]
  );

  useEditorKeybindings(handleEditorAction);

  return (
    <TabEditorContext.Provider
      value={{
        ...commands,
        tab,
        tracks,
        activeTrack,
        track,
        details,
        notes,
        isLoading,
        position,
        selection,
        editorIsOpen,
        isEditing,
        isSaving,
        isDemo,
        stringCount,
        isPlaying,
        togglePlayback,
        totalSteps,
        saveChanges,
      }}>
      {children}
    </TabEditorContext.Provider>
  );
}

export function useTabEditor() {
  const context = useContext(TabEditorContext);
  if (!context) {
    throw new Error("useTabEditor must be used within a TabEditorProvider");
  }
  return context;
}
