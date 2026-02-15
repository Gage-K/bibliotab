import { createContext, useState, useEffect, useContext } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { tabService } from "../api/services/tabService";
import {
  createEmptyFrame,
  isExistingPosition,
  isOnlyFrame,
  isOnlyMeasure,
  insertMeasure,
  insertFrame,
  removeMeasure,
  removeFrame,
  updateFrameNotes,
  resolvePositionAfterFrameDelete,
} from "../utils/tabOperations";
import type {
  EditorTabBodyType,
  EditorDetailsType,
  EditorFrameType,
  NoteFretType,
  TuningType,
} from "../shared/types/tab.types";
import type { TabPositionType } from "../shared/types/utilities.types";

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
  const axiosPrivate = useAxiosPrivate();

  const [tab, setTab] = useState<EditorTabBodyType>([]);
  const [details, setDetails] = useState<EditorDetailsType>({
    id: "",
    artist: "",
    song: "",
    tuning: ["E", "B", "G", "D", "A", "E"],
  });
  const isLoading = tab.length === 0;
  const [position, setPosition] = useState<TabPositionType>({ measure: 0, frame: 0 });
  const [editorIsOpen, setEditorIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function updateDetails(name: string, value: string | TuningType) {
    setDetails((prev) => ({ ...prev, [name]: value }));
    setIsEditing(true);
  }

  useEffect(() => {
    const controller = new AbortController();

    const getTab = async () => {
      try {
        const response = await tabService.getById(axiosPrivate, tabId, controller.signal);
        const data = response.data.data;
        setDetails({
          id: data.id,
          artist: data.details.artist,
          song: data.details.song,
          tuning: data.details.tuning,
        });
        setTab(data.body);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
        }
      }
    };

    getTab();

    return () => {
      controller.abort();
    };
  }, [tabId, axiosPrivate]);

  async function saveChanges() {
    setIsSaving(true);
    const data = {
      tab_name: details.song,
      tab_artist: details.artist,
      tuning: details.tuning,
      tab_data: tab,
    };

    try {
      await tabService.update(axiosPrivate, tabId, data);
      setIsSaving(false);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }

    setIsEditing(false);
  }

  function handleOpeningEditor() {
    setEditorIsOpen((prev) => !prev);
  }

  function updatePosition(measure: number, frame: number) {
    if (isExistingPosition(tab, measure, frame)) {
      setPosition({ measure, frame });
      return;
    }

    if (frame >= tab[measure]?.length) {
      const nextMeasure = measure + 1;
      if (nextMeasure < tab.length) {
        setPosition({ measure: nextMeasure, frame: 0 });
      }
      return;
    }

    if (frame < 0) {
      const prevMeasure = measure - 1;
      if (prevMeasure >= 0) {
        setPosition({
          measure: prevMeasure,
          frame: tab[prevMeasure]?.length - 1 || 0,
        });
      }
      return;
    }
  }

  function addNewMeasure(measure: number) {
    const newTab = insertMeasure(tab, measure);
    setTab(newTab);
    setPosition({ measure: measure === -1 ? 0 : measure, frame: 0 });
    setIsEditing(true);
  }

  function addNewFrame(measure: number, frame: number, isEmpty: boolean) {
    const newTab = insertFrame(tab, measure, frame, isEmpty);
    setTab(newTab);
    setIsEditing(true);
  }

  function addFrameAndAdvance(measure: number, frame: number, isEmpty: boolean) {
    const newTab = insertFrame(tab, measure, frame, isEmpty);
    setTab(newTab);
    if (isExistingPosition(newTab, measure, frame + 1)) {
      setPosition({ measure, frame: frame + 1 });
    }
    setIsEditing(true);
  }

  function deleteMeasure(measure: number) {
    if (isOnlyMeasure(tab)) {
      return;
    }
    const newTab = removeMeasure(tab, measure);
    setTab(newTab);
    const prevMeasure = measure - 1;
    setPosition({
      measure: prevMeasure,
      frame: newTab[prevMeasure]?.length - 1 || 0,
    });
    setIsEditing(true);
  }

  function deleteFrame(frame: number, measure: number) {
    if (isOnlyFrame(tab, measure)) {
      if (isOnlyMeasure(tab)) {
        return;
      } else {
        deleteMeasure(measure);
        return;
      }
    }

    const newTab = removeFrame(tab, measure, frame);
    setTab(newTab);
    setPosition(resolvePositionAfterFrameDelete(newTab, measure, frame));
    setIsEditing(true);
  }

  function updateTabData(measure: number, index: number, formData: NoteFretType[]) {
    setTab(updateFrameNotes(tab, measure, index, formData));
    setIsEditing(true);
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
