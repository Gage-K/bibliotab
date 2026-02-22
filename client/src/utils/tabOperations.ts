import { nanoid } from "nanoid";
import type {
  TabBodyType,
  FrameType,
  NoteFretType,
} from "../shared/types/tab.types"
import type { TabPositionType } from "../shared/types/utilities.types";

export function createEmptyFrame(): FrameType {
  return {
    id: nanoid(),
    notes: [
      { fret: -2, style: "none" },
      { fret: -2, style: "none" },
      { fret: -2, style: "none" },
      { fret: -2, style: "none" },
      { fret: -2, style: "none" },
      { fret: -2, style: "none" },
    ],
  };
}

export function isExistingPosition(
  tab: TabBodyType,
  measure: number,
  frame: number
): boolean {
  return tab[measure] != undefined ? tab[measure][frame] != undefined : false;
}

export function isOnlyFrame(tab: TabBodyType, measure: number): boolean {
  return tab[measure].length === 1;
}

export function isOnlyMeasure(tab: TabBodyType): boolean {
  return tab.length === 1;
}

export function insertMeasure(
  tab: TabBodyType,
  measure: number
): TabBodyType {
  const newMeasure = [createEmptyFrame()];
  return measure === -1
    ? [newMeasure, ...tab]
    : [...tab.slice(0, measure), newMeasure, ...tab.slice(measure)];
}

export function insertFrame(
  tab: TabBodyType,
  measure: number,
  frame: number,
  isEmpty: boolean
): TabBodyType {
  const newFrame = isEmpty
    ? createEmptyFrame()
    : { ...tab[measure][frame], id: nanoid() };

  return tab.map((prevMeasure, i) =>
    i === measure
      ? [
          ...prevMeasure.slice(0, frame + 1),
          newFrame,
          ...prevMeasure.slice(frame + 1),
        ]
      : prevMeasure
  );
}

export function removeMeasure(
  tab: TabBodyType,
  measure: number
): TabBodyType {
  return tab.filter((_prevMeasure, index) => index !== measure);
}

export function removeFrame(
  tab: TabBodyType,
  measure: number,
  frame: number
): TabBodyType {
  return tab.map((prevMeasure, i) =>
    i === measure
      ? prevMeasure.filter((_prevFrame, j) => j !== frame)
      : prevMeasure
  );
}

export function updateFrameNotes(
  tab: TabBodyType,
  measure: number,
  frame: number,
  formData: NoteFretType[]
): TabBodyType {
  return tab.map((prevMeasure, measureIndex) =>
    prevMeasure.map((prevFrame, frameIndex) =>
      frameIndex === frame && measureIndex === measure
        ? { id: nanoid(), notes: formData }
        : prevFrame
    )
  );
}

export function resolvePositionAfterFrameDelete(
  tab: TabBodyType,
  measure: number,
  frame: number
): TabPositionType {
  if (isExistingPosition(tab, measure, frame)) {
    return { measure, frame, string: 0 };
  }
  if (isExistingPosition(tab, measure + 1, 0)) {
    return { measure: measure + 1, frame: 0, string: 0 };
  }
  return { measure, frame: frame - 1, string: 0 };
}
