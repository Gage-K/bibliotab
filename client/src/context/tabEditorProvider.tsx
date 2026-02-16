import { createContext, useReducer, useEffect, useContext, useRef } from "react";
import { createEmptyFrame } from "../utils/tabOperations";
import { useTab, useUpdateTab } from "../hooks/useTabs";
import type {
  EditorTabBodyType,
  EditorDetailsType,
  EditorFrameType,
  NoteFretType,
  TuningType,
} from "../shared/types/tab.types";
import type { TabPositionType } from "../shared/types/utilities.types";
import { tabEditorReducer, initialTabEditorState } from "./tabEditorReducer";

interface TabEditorContextType {
  tab: EditorTabBodyType;
  details: EditorDetailsType;
  isLoading: boolean;
  position: TabPositionType;
  editorIsOpen: boolean;
  isEditing: boolean;
  isSaving: boolean;
  updateDetails: (name: string, value: string | TuningType) => void;
  saveChanges: () => Promise<void>;
  handleOpeningEditor: () => void;
  updatePosition: (measure: number, frame: number) => void;
  getEmptyFrame: () => EditorFrameType;
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
  children,
}: {
  tabId: string;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(tabEditorReducer, initialTabEditorState);
  const { tab, details, position, editorIsOpen, isEditing, isSaving } = state;

  const { data: serverTab, isLoading: isQueryLoading } = useTab(tabId);
  const updateTabMutation = useUpdateTab(tabId);

  const hasLoaded = useRef(false);
  useEffect(() => {
    if (serverTab && !hasLoaded.current) {
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
  }, [serverTab]);

  const isLoading = isQueryLoading || tab.length === 0;

  function updateDetails(name: string, value: string | TuningType) {
    dispatch({ type: "UPDATE_DETAILS", payload: { name, value } });
  }

  async function saveChanges() {
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

  return (
    <TabEditorContext.Provider
      value={{
        tab,
        details,
        isLoading,
        position,
        editorIsOpen,
        isEditing,
        isSaving,
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

export default TabEditorContext;
