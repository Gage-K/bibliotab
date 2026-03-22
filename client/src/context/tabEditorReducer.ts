import type {
  TabBodyType,
  EditorDetailsType,
  NoteFretType,
  NoteStyleType,
  TuningType,
} from "../shared/types/tab.types";
import type { TabPositionType, TabSelectionType } from "../shared/types/utilities.types";
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

export interface TabEditorState {
  tab: TabBodyType;
  details: EditorDetailsType;
  position: TabPositionType;
  selection: TabSelectionType;
  editorIsOpen: boolean;
  isEditing: boolean;
  isSaving: boolean;
}

export const initialTabEditorState: TabEditorState = {
  tab: [],
  details: { id: "", artist: "", song: "", tuning: ["E", "B", "G", "D", "A", "E"] },
  position: { measure: 0, frame: 0, string: 0 },
  selection: null,
  editorIsOpen: false,
  isEditing: false,
  isSaving: false,
};

export type TabEditorAction =
  | { type: "SET_TAB_DATA"; payload: { tab: TabBodyType; details: EditorDetailsType } }
  | { type: "UPDATE_DETAILS"; payload: { name: string; value: string | TuningType } }
  | { type: "UPDATE_TAB_FRAME"; payload: { measure: number; frame: number; formData: NoteFretType[] } }
  | { type: "ADD_MEASURE"; payload: { measure: number } }
  | { type: "ADD_FRAME"; payload: { measure: number; frame: number; isEmpty: boolean } }
  | { type: "ADD_FRAME_AND_ADVANCE"; payload: { measure: number; frame: number; isEmpty: boolean } }
  | { type: "DELETE_FRAME"; payload: { frame: number; measure: number } }
  | { type: "SET_POSITION"; payload: { measure: number; frame: number } }
  | { type: "SET_STRING"; payload: { string: number } }
  | { type: "SET_NOTE_FRET"; payload: { measure: number; frame: number; string: number; fret: number } }
  | { type: "SET_NOTE_STYLE"; payload: { measure: number; frame: number; string: number; style: NoteStyleType } }
  | { type: "EXTEND_SELECTION"; payload: { measure: number; frame: number } }
  | { type: "TOGGLE_EDITOR" }
  | { type: "SAVE_START" }
  | { type: "SAVE_SUCCESS" }
  | { type: "SAVE_FAILURE" };

export function tabEditorReducer(state: TabEditorState, action: TabEditorAction): TabEditorState {
  switch (action.type) {
    case "SET_TAB_DATA":
      return {
        ...state,
        tab: action.payload.tab,
        details: action.payload.details,
      };

    case "UPDATE_DETAILS":
      return {
        ...state,
        details: { ...state.details, [action.payload.name]: action.payload.value },
        isEditing: true,
      };

    case "UPDATE_TAB_FRAME":
      return {
        ...state,
        tab: updateFrameNotes(state.tab, action.payload.measure, action.payload.frame, action.payload.formData),
        isEditing: true,
      };

    case "ADD_MEASURE": {
      const { measure } = action.payload;
      const newTab = insertMeasure(state.tab, measure);
      return {
        ...state,
        tab: newTab,
        position: { measure: measure === -1 ? 0 : measure, frame: 0, string: 0 },
        isEditing: true,
      };
    }

    case "ADD_FRAME": {
      const { measure, frame, isEmpty } = action.payload;
      return {
        ...state,
        tab: insertFrame(state.tab, measure, frame, isEmpty),
        isEditing: true,
      };
    }

    case "ADD_FRAME_AND_ADVANCE": {
      const { measure, frame, isEmpty } = action.payload;
      const newTab = insertFrame(state.tab, measure, frame, isEmpty);
      const newPosition = isExistingPosition(newTab, measure, frame + 1)
        ? { measure, frame: frame + 1, string: state.position.string }
        : state.position;
      return {
        ...state,
        tab: newTab,
        position: newPosition,
        isEditing: true,
      };
    }

    case "DELETE_FRAME": {
      const { frame, measure } = action.payload;

      if (isOnlyFrame(state.tab, measure)) {
        if (isOnlyMeasure(state.tab)) {
          return state;
        }
        const newTab = removeMeasure(state.tab, measure);
        const prevMeasure = measure - 1;
        return {
          ...state,
          tab: newTab,
          position: {
            measure: prevMeasure,
            frame: newTab[prevMeasure]?.length - 1 || 0,
            string: 0,
          },
          isEditing: true,
        };
      }

      const newTab = removeFrame(state.tab, measure, frame);
      return {
        ...state,
        tab: newTab,
        position: resolvePositionAfterFrameDelete(newTab, measure, frame),
        isEditing: true,
      };
    }

    case "SET_POSITION": {
      const { measure, frame } = action.payload;
      const { tab } = state;

      if (isExistingPosition(tab, measure, frame)) {
        return {
          ...state,
          selection: null,
          position: { measure, frame, string: state.position.string },
        };
      }

      if (frame >= tab[measure]?.length) {
        const nextMeasure = measure + 1;
        if (nextMeasure < tab.length) {
          return {
            ...state,
            selection: null,
            position: { measure: nextMeasure, frame: 0, string: state.position.string },
          };
        }
        return state;
      }

      if (frame < 0) {
        const prevMeasure = measure - 1;
        if (prevMeasure >= 0) {
          return {
            ...state,
            selection: null,
            position: {
              measure: prevMeasure,
              frame: tab[prevMeasure]?.length - 1 || 0,
              string: state.position.string,
            },
          };
        }
        return state;
      }

      return state;
    }

    case "SET_STRING": {
      const newString = action.payload.string;
      if (newString < 0 || newString > 5) return state;
      return {
        ...state,
        position: { ...state.position, string: newString },
      };
    }

    case "SET_NOTE_FRET": {
      const { measure, frame, string: stringIdx, fret } = action.payload;
      const currentFrame = state.tab[measure]?.[frame];
      if (!currentFrame) return state;
      const newNotes = currentFrame.notes.map((note, i) =>
        i === stringIdx ? { ...note, fret } : note
      );
      return {
        ...state,
        tab: updateFrameNotes(state.tab, measure, frame, newNotes),
        isEditing: true,
      };
    }

    case "SET_NOTE_STYLE": {
      const { measure, frame, string: stringIdx, style } = action.payload;
      const currentFrame = state.tab[measure]?.[frame];
      if (!currentFrame) return state;
      const note = currentFrame.notes[stringIdx];
      if (!note || note.fret === -2 || note.fret === -1) return state;
      const newNotes = currentFrame.notes.map((n, i) =>
        i === stringIdx ? { ...n, style } : n
      );
      return {
        ...state,
        tab: updateFrameNotes(state.tab, measure, frame, newNotes),
        isEditing: true,
      };
    }

    case "EXTEND_SELECTION": {
      const { measure, frame } = action.payload;
      const { tab } = state;
      if (!isExistingPosition(tab, measure, frame)) return state;

      const newPosition = { ...state.position, measure, frame };
      if (state.selection) {
        return {
          ...state,
          position: newPosition,
          selection: { ...state.selection, head: { measure, frame, string: 0 } },
        };
      }
      return {
        ...state,
        position: newPosition,
        selection: {
          anchor: { ...state.position },
          head: { measure, frame, string: 0 },
        },
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
