import { createContext, useReducer, useEffect, useContext, useRef, useCallback } from "react";
import {
  createEmptyFrame,
  frameDuration,
  getFrame,
  getMeasures,
  stepDuration,
  toggleDot,
} from "../utils/tabOperations";
import { useTab, useUpdateTab } from "../hooks/useTabs";
import { useEditorKeybindings } from "../hooks/useEditorKeybindings";
import type { EditorAction } from "../shared/keymaps/defaultKeymap";
import type { NoteStyleType } from "../shared/types/tab.types";
import type {
  TabBodyType,
  TrackType,
  EditorDetailsType,
  FrameType,
  NoteFretType,
  TimeSignatureType,
  TuningType,
} from "../shared/types/tab.types";
import type { TabPositionType, TabSelectionType } from "../shared/types/utilities.types";
import {
  tabEditorReducer,
  initialTabEditorState,
  activeBody,
} from "./tabEditorReducer";
import { normalizeTracks, trackStringCount } from "../utils/trackOperations";
import { useTabPlayback } from "../hooks/useTabPlayback";

const FRET_EMPTY = -2;
const FRET_MUTED = -1;
const MAX_FRET = 24;
const DIGIT_BUFFER_TIMEOUT_MS = 200;

type MeasureRef = { section: number; measure: number };

interface TabEditorContextType {
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
  updateDetails: (name: string, value: string) => void;
  setNotes: (notes: string) => void;
  /** Moves the cursor to a frame by id. A no-op if that frame no longer exists. */
  goToFrameById: (frameId: string) => void;
  setBpm: (bpm: number) => void;
  setTimeSignature: (timeSignature: TimeSignatureType) => void;
  setFrameDuration: (
    section: number,
    measure: number,
    frame: number,
    duration: number,
  ) => void;
  setFrameRest: (
    section: number,
    measure: number,
    frame: number,
    isRest: boolean,
  ) => void;
  setMeasureTimeSignature: (
    section: number,
    measure: number,
    timeSignature: TimeSignatureType | null,
  ) => void;
  saveChanges: () => Promise<void>;
  handleOpeningEditor: () => void;
  updatePosition: (section: number, measure: number, frame: number) => void;
  getEmptyFrame: () => FrameType;
  addNewMeasure: (section: number, measure: number) => void;
  addNewFrame: (section: number, measure: number, frame: number, isEmpty: boolean) => void;
  addFrameAndAdvance: (section: number, measure: number, frame: number, isEmpty: boolean) => void;
  /** Duplicates the current selection, or the cursor's frame when nothing is selected. */
  duplicateFrames: () => void;
  deleteMeasure: (section: number, measure: number) => void;
  deleteFrame: (section: number, measure: number, frame: number) => void;
  updateTabData: (section: number, measure: number, frame: number, formData: NoteFretType[]) => void;
  addSection: (index: number, name: string) => void;
  renameSection: (index: number, name: string) => void;
  deleteSection: (index: number) => void;
  moveMeasure: (from: MeasureRef, to: MeasureRef) => void;
  setActiveTrack: (index: number) => void;
  addTrack: (options: {
    name: string;
    instrument: string;
    tuning: TuningType;
    octaves?: number[];
  }) => void;
  removeTrack: (index: number) => void;
  renameTrack: (index: number, name: string) => void;
  setTrackTuning: (
    index: number,
    tuning: TuningType,
    options?: { instrument?: string; octaves?: number[] },
  ) => void;
}

const TabEditorContext = createContext<TabEditorContextType | null>(null);

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
          tracks: normalizeTracks({ tracks: demoData.tracks }),
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
          // can still be a pre-tracks shape (see normalizeTracks).
          tracks: normalizeTracks({ tracks: serverTab.tracks }),
          notes: serverTab.notes ?? "",
        },
      });
    }
  }, [serverTab, demoData]);

  const isLoading = isDemo ? false : isQueryLoading || tracks.length === 0;
  const stringCount = trackStringCount(track);

  function updateDetails(name: string, value: string) {
    dispatch({ type: "UPDATE_DETAILS", payload: { name, value } });
  }

  function setNotes(next: string) {
    dispatch({ type: "SET_NOTES", payload: { notes: next } });
  }

  function goToFrameById(frameId: string) {
    dispatch({ type: "GO_TO_FRAME", payload: { frameId } });
  }

  function setBpm(bpm: number) {
    dispatch({ type: "SET_BPM", payload: { bpm } });
  }

  function setTimeSignature(timeSignature: TimeSignatureType) {
    dispatch({ type: "SET_TIME_SIGNATURE", payload: { timeSignature } });
  }

  function setFrameDuration(
    section: number,
    measure: number,
    frame: number,
    duration: number,
  ) {
    dispatch({ type: "SET_FRAME_DURATION", payload: { section, measure, frame, duration } });
  }

  function setFrameRest(
    section: number,
    measure: number,
    frame: number,
    isRest: boolean,
  ) {
    dispatch({ type: "SET_FRAME_REST", payload: { section, measure, frame, isRest } });
  }

  function setMeasureTimeSignature(
    section: number,
    measure: number,
    timeSignature: TimeSignatureType | null,
  ) {
    dispatch({
      type: "SET_MEASURE_TIME_SIGNATURE",
      payload: { section, measure, timeSignature },
    });
  }

  function setActiveTrack(index: number) {
    dispatch({ type: "SET_ACTIVE_TRACK", payload: { index } });
  }

  function addTrack(options: {
    name: string;
    instrument: string;
    tuning: TuningType;
    octaves?: number[];
  }) {
    dispatch({ type: "ADD_TRACK", payload: options });
  }

  function removeTrack(index: number) {
    dispatch({ type: "REMOVE_TRACK", payload: { index } });
  }

  function renameTrack(index: number, name: string) {
    dispatch({ type: "RENAME_TRACK", payload: { index, name } });
  }

  function setTrackTuning(
    index: number,
    tuning: TuningType,
    options?: { instrument?: string; octaves?: number[] },
  ) {
    dispatch({ type: "SET_TRACK_TUNING", payload: { index, tuning, ...options } });
  }

  async function saveChanges() {
    if (isDemo) return;
    dispatch({ type: "SAVE_START" });
    const data = {
      tab_name: details.song,
      tab_artist: details.artist,
      // `tuning` is vestigial on the server (NOT NULL column) but still required by the
      // API; it mirrors track 0.
      tuning: tracks[0]?.tuning ?? [],
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

  function handleOpeningEditor() {
    dispatch({ type: "TOGGLE_EDITOR" });
  }

  function updatePosition(section: number, measure: number, frame: number) {
    dispatch({ type: "SET_POSITION", payload: { section, measure, frame } });
  }

  function addNewMeasure(section: number, measure: number) {
    dispatch({ type: "ADD_MEASURE", payload: { section, measure } });
  }

  function addNewFrame(section: number, measure: number, frame: number, isEmpty: boolean) {
    dispatch({ type: "ADD_FRAME", payload: { section, measure, frame, isEmpty } });
  }

  function addFrameAndAdvance(section: number, measure: number, frame: number, isEmpty: boolean) {
    dispatch({ type: "ADD_FRAME_AND_ADVANCE", payload: { section, measure, frame, isEmpty } });
  }

  function duplicateFrames() {
    dispatch({ type: "DUPLICATE_FRAMES" });
  }

  function deleteMeasure(section: number, measure: number) {
    dispatch({ type: "DELETE_FRAME", payload: { section, measure, frame: 0 } });
  }

  function deleteFrame(section: number, measure: number, frame: number) {
    dispatch({ type: "DELETE_FRAME", payload: { section, measure, frame } });
  }

  function updateTabData(
    section: number,
    measure: number,
    frame: number,
    formData: NoteFretType[]
  ) {
    dispatch({ type: "UPDATE_TAB_FRAME", payload: { section, measure, frame, formData } });
  }

  function addSection(index: number, name: string) {
    dispatch({ type: "ADD_SECTION", payload: { index, name } });
  }

  function renameSection(index: number, name: string) {
    dispatch({ type: "RENAME_SECTION", payload: { index, name } });
  }

  function deleteSection(index: number) {
    dispatch({ type: "DELETE_SECTION", payload: { index } });
  }

  function moveMeasure(from: MeasureRef, to: MeasureRef) {
    dispatch({ type: "MOVE_MEASURE", payload: { from, to } });
  }

  const getEmptyFrame = useCallback(
    () => createEmptyFrame(stringCount),
    [stringCount]
  );

  // ==========================================================================
  // Playback
  //
  // Lives here rather than in the transport component because two consumers need it:
  // the transport button and the timeline's playhead.
  // ==========================================================================
  const updatePositionRef = useRef(updatePosition);
  updatePositionRef.current = updatePosition;

  const handlePlaybackStep = useCallback((stepPosition: TabPositionType) => {
    updatePositionRef.current(
      stepPosition.section,
      stepPosition.measure,
      stepPosition.frame,
    );
  }, []);

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

  // Fret digit buffering
  const digitBufferRef = useRef("");
  const digitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitFret = useCallback(
    (fret: number) => {
      if (fret > MAX_FRET) return;
      dispatch({
        type: "SET_NOTE_FRET",
        payload: {
          section: position.section,
          measure: position.measure,
          frame: position.frame,
          string: position.string,
          fret,
        },
      });
    },
    [position]
  );

  const clearDigitBuffer = useCallback(() => {
    digitBufferRef.current = "";
    if (digitTimerRef.current) {
      clearTimeout(digitTimerRef.current);
      digitTimerRef.current = null;
    }
  }, []);

  const handleDigit = useCallback(
    (digit: number) => {
      if (digitTimerRef.current) {
        clearTimeout(digitTimerRef.current);
        digitTimerRef.current = null;
      }

      const buffer = digitBufferRef.current + String(digit);
      const twoDigit = parseInt(buffer, 10);

      if (buffer.length >= 2) {
        if (twoDigit <= MAX_FRET) {
          commitFret(twoDigit);
        } else {
          // Two-digit number > 24: commit first digit, start new buffer with second
          commitFret(parseInt(buffer[0], 10));
          digitBufferRef.current = buffer[1];
          digitTimerRef.current = setTimeout(() => {
            commitFret(parseInt(digitBufferRef.current, 10));
            clearDigitBuffer();
          }, DIGIT_BUFFER_TIMEOUT_MS);
          return;
        }
        clearDigitBuffer();
        return;
      }

      // Single digit — buffer and wait
      digitBufferRef.current = buffer;
      digitTimerRef.current = setTimeout(() => {
        commitFret(parseInt(digitBufferRef.current, 10));
        clearDigitBuffer();
      }, DIGIT_BUFFER_TIMEOUT_MS);
    },
    [commitFret, clearDigitBuffer]
  );

  const toggleStyle = useCallback(
    (style: NoteStyleType) => {
      const currentFrame = getFrame(tab, position.section, position.measure, position.frame);
      if (!currentFrame) return;
      const note = currentFrame.notes[position.string];
      if (!note || note.fret === FRET_EMPTY || note.fret === FRET_MUTED) return;

      const newStyle: NoteStyleType = note.style === style ? "none" : style;
      dispatch({
        type: "SET_NOTE_STYLE",
        payload: {
          section: position.section,
          measure: position.measure,
          frame: position.frame,
          string: position.string,
          style: newStyle,
        },
      });
    },
    [tab, position]
  );

  const handleEditorAction = useCallback(
    (action: EditorAction) => {
      const { section, measure, frame } = position;

      switch (action) {
        // Navigation
        case "moveUp":
          dispatch({ type: "SET_STRING", payload: { string: position.string - 1 } });
          break;
        case "moveDown":
          dispatch({ type: "SET_STRING", payload: { string: position.string + 1 } });
          break;
        case "moveLeft":
          dispatch({ type: "SET_POSITION", payload: { section, measure, frame: frame - 1 } });
          break;
        case "moveRight":
          dispatch({ type: "SET_POSITION", payload: { section, measure, frame: frame + 1 } });
          break;
        case "nextMeasureStart": {
          const next = measure + 1;
          if (next < getMeasures(tab, section).length) {
            dispatch({ type: "SET_POSITION", payload: { section, measure: next, frame: 0 } });
          } else if (getMeasures(tab, section + 1).length > 0) {
            // Falls through to the first measure of the next section.
            dispatch({ type: "SET_POSITION", payload: { section: section + 1, measure: 0, frame: 0 } });
          }
          break;
        }
        case "prevMeasureStart": {
          if (frame > 0) {
            dispatch({ type: "SET_POSITION", payload: { section, measure, frame: 0 } });
          } else if (measure - 1 >= 0) {
            dispatch({ type: "SET_POSITION", payload: { section, measure: measure - 1, frame: 0 } });
          } else {
            const prevMeasures = getMeasures(tab, section - 1);
            if (prevMeasures.length > 0) {
              dispatch({
                type: "SET_POSITION",
                payload: { section: section - 1, measure: prevMeasures.length - 1, frame: 0 },
              });
            }
          }
          break;
        }

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

        // Fret digits
        case "fretDigit0": handleDigit(0); break;
        case "fretDigit1": handleDigit(1); break;
        case "fretDigit2": handleDigit(2); break;
        case "fretDigit3": handleDigit(3); break;
        case "fretDigit4": handleDigit(4); break;
        case "fretDigit5": handleDigit(5); break;
        case "fretDigit6": handleDigit(6); break;
        case "fretDigit7": handleDigit(7); break;
        case "fretDigit8": handleDigit(8); break;
        case "fretDigit9": handleDigit(9); break;

        // Note operations
        case "clearNote":
          dispatch({
            type: "SET_NOTE_FRET",
            payload: {
              section,
              measure,
              frame,
              string: position.string,
              fret: FRET_EMPTY,
            },
          });
          break;
        case "muteNote":
          dispatch({
            type: "SET_NOTE_FRET",
            payload: {
              section,
              measure,
              frame,
              string: position.string,
              fret: FRET_MUTED,
            },
          });
          break;

        // Styles
        case "styleBend": toggleStyle("bend"); break;
        case "styleSlide": toggleStyle("slide"); break;
        case "styleHammerOn": toggleStyle("hammerOn"); break;
        case "stylePullOff": toggleStyle("pullOff"); break;
        case "styleHarmonic": toggleStyle("harmonic"); break;
        case "styleTap": toggleStyle("tap"); break;

        // Inserts
        case "addFrameBefore":
          dispatch({ type: "ADD_FRAME", payload: { section, measure, frame: frame - 1, isEmpty: true } });
          dispatch({ type: "SET_POSITION", payload: { section, measure, frame: frame + 1 } });
          break;
        case "addFrameAfter":
          dispatch({ type: "ADD_FRAME", payload: { section, measure, frame, isEmpty: true } });
          break;
        case "duplicateFrame":
          dispatch({ type: "DUPLICATE_FRAMES" });
          break;
        case "addMeasureBefore":
          dispatch({ type: "ADD_MEASURE", payload: { section, measure } });
          dispatch({ type: "SET_POSITION", payload: { section, measure: measure + 1, frame } });
          break;
        case "addMeasureAfter":
          dispatch({ type: "ADD_MEASURE", payload: { section, measure: measure + 1 } });
          break;

        case "deleteFrame":
          dispatch({ type: "DELETE_FRAME", payload: { section, measure, frame } });
          break;

        // Duration — step the current frame through the editor's note values.
        case "durationLonger":
        case "durationShorter": {
          const current = getFrame(tab, section, measure, frame);
          if (!current) break;
          const next = stepDuration(
            frameDuration(current),
            action === "durationLonger" ? "longer" : "shorter",
          );
          dispatch({
            type: "SET_FRAME_DURATION",
            payload: { section, measure, frame, duration: next },
          });
          break;
        }

        case "toggleDot": {
          const current = getFrame(tab, section, measure, frame);
          if (!current) break;
          dispatch({
            type: "SET_FRAME_DURATION",
            payload: { section, measure, frame, duration: toggleDot(frameDuration(current)) },
          });
          break;
        }

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

        // Escape
        case "escape":
          dispatch({ type: "SET_POSITION", payload: { section, measure, frame } });
          break;
      }
    },
    [tab, position, handleDigit, toggleStyle]
  );

  useEditorKeybindings(handleEditorAction);

  return (
    <TabEditorContext.Provider
      value={{
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
        updateDetails,
        setNotes,
        goToFrameById,
        setBpm,
        setTimeSignature,
        setFrameDuration,
        setFrameRest,
        setMeasureTimeSignature,
        saveChanges,
        handleOpeningEditor,
        updatePosition,
        getEmptyFrame,
        addNewMeasure,
        addNewFrame,
        addFrameAndAdvance,
        duplicateFrames,
        deleteMeasure,
        deleteFrame,
        updateTabData,
        addSection,
        renameSection,
        deleteSection,
        moveMeasure,
        setActiveTrack,
        addTrack,
        removeTrack,
        renameTrack,
        setTrackTuning,
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

export function useOptionalTabEditor() {
  return useContext(TabEditorContext);
}

export default TabEditorContext;
