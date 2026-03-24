import { createContext, useReducer, useEffect, useContext, useRef, useCallback } from "react";
import { createEmptyFrame } from "../utils/tabOperations";
import { useTab, useUpdateTab } from "../hooks/useTabs";
import { useEditorKeybindings } from "../hooks/useEditorKeybindings";
import type { EditorAction } from "../shared/keymaps/defaultKeymap";
import type { NoteStyleType } from "../shared/types/tab.types";
import type {
  TabBodyType,
  EditorDetailsType,
  FrameType,
  NoteFretType,
  TuningType,
} from "../shared/types/tab.types";
import type { TabPositionType, TabSelectionType } from "../shared/types/utilities.types";
import { tabEditorReducer, initialTabEditorState } from "./tabEditorReducer";

const FRET_EMPTY = -2;
const FRET_MUTED = -1;
const MAX_FRET = 24;
const DIGIT_BUFFER_TIMEOUT_MS = 200;

interface TabEditorContextType {
  tab: TabBodyType;
  details: EditorDetailsType;
  isLoading: boolean;
  position: TabPositionType;
  selection: TabSelectionType;
  editorIsOpen: boolean;
  isEditing: boolean;
  isSaving: boolean;
  isDemo: boolean;
  updateDetails: (name: string, value: string | TuningType) => void;
  saveChanges: () => Promise<void>;
  handleOpeningEditor: () => void;
  updatePosition: (measure: number, frame: number) => void;
  getEmptyFrame: () => FrameType;
  addNewMeasure: (measure: number) => void;
  addNewFrame: (measure: number, frame: number, isEmpty: boolean) => void;
  addFrameAndAdvance: (measure: number, frame: number, isEmpty: boolean) => void;
  deleteMeasure: (measure: number) => void;
  deleteFrame: (frame: number, measure: number) => void;
  updateTabData: (measure: number, index: number, formData: NoteFretType[]) => void;
}

const TabEditorContext = createContext<TabEditorContextType | null>(null);

export function TabEditorProvider({
  tabId,
  demoData,
  children,
}: {
  tabId?: string;
  demoData?: { tab: TabBodyType; details: EditorDetailsType };
  children: React.ReactNode;
}) {
  const isDemo = !!demoData;
  const [state, dispatch] = useReducer(tabEditorReducer, initialTabEditorState);
  const { tab, details, position, selection, editorIsOpen, isEditing, isSaving } = state;

  const { data: serverTab, isLoading: isQueryLoading } = useTab(tabId ?? "", { enabled: !isDemo && !!tabId });
  const updateTabMutation = useUpdateTab(tabId ?? "");

  const hasLoaded = useRef(false);
  useEffect(() => {
    if (demoData && !hasLoaded.current) {
      hasLoaded.current = true;
      dispatch({ type: "SET_TAB_DATA", payload: demoData });
    } else if (serverTab && !hasLoaded.current) {
      hasLoaded.current = true;
      dispatch({
        type: "SET_TAB_DATA",
        payload: {
          details: {
            id: serverTab.id,
            artist: serverTab.details.artist,
            song: serverTab.details.song,
            tuning: serverTab.details.tuning,
          },
          tab: serverTab.body,
        },
      });
    }
  }, [serverTab, demoData]);

  const isLoading = isDemo ? false : isQueryLoading || tab.length === 0;

  function updateDetails(name: string, value: string | TuningType) {
    dispatch({ type: "UPDATE_DETAILS", payload: { name, value } });
  }

  async function saveChanges() {
    if (isDemo) return;
    dispatch({ type: "SAVE_START" });
    const data = {
      tab_name: details.song,
      tab_artist: details.artist,
      tuning: details.tuning,
      tab_data: tab,
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

  function updatePosition(measure: number, frame: number) {
    dispatch({ type: "SET_POSITION", payload: { measure, frame } });
  }

  function addNewMeasure(measure: number) {
    dispatch({ type: "ADD_MEASURE", payload: { measure } });
  }

  function addNewFrame(measure: number, frame: number, isEmpty: boolean) {
    dispatch({ type: "ADD_FRAME", payload: { measure, frame, isEmpty } });
  }

  function addFrameAndAdvance(measure: number, frame: number, isEmpty: boolean) {
    dispatch({ type: "ADD_FRAME_AND_ADVANCE", payload: { measure, frame, isEmpty } });
  }

  function deleteMeasure(measure: number) {
    dispatch({ type: "DELETE_FRAME", payload: { frame: 0, measure } });
  }

  function deleteFrame(frame: number, measure: number) {
    dispatch({ type: "DELETE_FRAME", payload: { frame, measure } });
  }

  function updateTabData(measure: number, index: number, formData: NoteFretType[]) {
    dispatch({ type: "UPDATE_TAB_FRAME", payload: { measure, frame: index, formData } });
  }

  // Fret digit buffering
  const digitBufferRef = useRef("");
  const digitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitFret = useCallback(
    (fret: number) => {
      if (fret > MAX_FRET) return;
      dispatch({
        type: "SET_NOTE_FRET",
        payload: {
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
      const currentFrame = tab[position.measure]?.[position.frame];
      if (!currentFrame) return;
      const note = currentFrame.notes[position.string];
      if (!note || note.fret === FRET_EMPTY || note.fret === FRET_MUTED) return;

      const newStyle: NoteStyleType = note.style === style ? "none" : style;
      dispatch({
        type: "SET_NOTE_STYLE",
        payload: {
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
      switch (action) {
        // Navigation
        case "moveUp":
          dispatch({ type: "SET_STRING", payload: { string: position.string - 1 } });
          break;
        case "moveDown":
          dispatch({ type: "SET_STRING", payload: { string: position.string + 1 } });
          break;
        case "moveLeft":
          dispatch({ type: "SET_POSITION", payload: { measure: position.measure, frame: position.frame - 1 } });
          break;
        case "moveRight":
          dispatch({ type: "SET_POSITION", payload: { measure: position.measure, frame: position.frame + 1 } });
          break;
        case "nextMeasureStart": {
          const next = position.measure + 1;
          if (next < tab.length) {
            dispatch({ type: "SET_POSITION", payload: { measure: next, frame: 0 } });
          }
          break;
        }
        case "prevMeasureStart": {
          if (position.frame > 0) {
            dispatch({ type: "SET_POSITION", payload: { measure: position.measure, frame: 0 } });
          } else {
            const prev = position.measure - 1;
            if (prev >= 0) {
              dispatch({ type: "SET_POSITION", payload: { measure: prev, frame: 0 } });
            }
          }
          break;
        }

        // Selection
        case "selectLeft":
          dispatch({
            type: "EXTEND_SELECTION",
            payload: { measure: position.measure, frame: position.frame - 1 },
          });
          break;
        case "selectRight":
          dispatch({
            type: "EXTEND_SELECTION",
            payload: { measure: position.measure, frame: position.frame + 1 },
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
              measure: position.measure,
              frame: position.frame,
              string: position.string,
              fret: FRET_EMPTY,
            },
          });
          break;
        case "muteNote":
          dispatch({
            type: "SET_NOTE_FRET",
            payload: {
              measure: position.measure,
              frame: position.frame,
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
          dispatch({ type: "ADD_FRAME", payload: { measure: position.measure, frame: position.frame - 1, isEmpty: true } });
          dispatch({ type: "SET_POSITION", payload: { measure: position.measure, frame: position.frame + 1 } });
          break;
        case "addFrameAfter":
          dispatch({ type: "ADD_FRAME", payload: { measure: position.measure, frame: position.frame, isEmpty: true } });
          break;
        case "duplicateFrame":
          dispatch({ type: "ADD_FRAME_AND_ADVANCE", payload: { measure: position.measure, frame: position.frame, isEmpty: false } });
          break;
        case "addMeasureBefore":
          dispatch({ type: "ADD_MEASURE", payload: { measure: position.measure } });
          dispatch({ type: "SET_POSITION", payload: { measure: position.measure + 1, frame: position.frame } });
          break;
        case "addMeasureAfter":
          dispatch({ type: "ADD_MEASURE", payload: { measure: position.measure + 1 } });
          break;

        case "deleteFrame":
          dispatch({ type: "DELETE_FRAME", payload: { measure: position.measure, frame: position.frame } })

        // Escape
        case "escape":
          dispatch({ type: "SET_POSITION", payload: { measure: position.measure, frame: position.frame } });
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
        details,
        isLoading,
        position,
        selection,
        editorIsOpen,
        isEditing,
        isSaving,
        isDemo,
        updateDetails,
        saveChanges,
        handleOpeningEditor,
        updatePosition,
        getEmptyFrame: createEmptyFrame,
        addNewMeasure,
        addNewFrame,
        addFrameAndAdvance,
        deleteMeasure,
        deleteFrame,
        updateTabData,
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
