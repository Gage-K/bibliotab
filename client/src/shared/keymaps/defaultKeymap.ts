export type EditorAction =
  | "moveUp"
  | "moveDown"
  | "moveLeft"
  | "moveRight"
  | "nextMeasureStart"
  | "prevMeasureStart"
  | "selectLeft"
  | "selectRight"
  | "fretDigit0"
  | "fretDigit1"
  | "fretDigit2"
  | "fretDigit3"
  | "fretDigit4"
  | "fretDigit5"
  | "fretDigit6"
  | "fretDigit7"
  | "fretDigit8"
  | "fretDigit9"
  | "clearNote"
  | "muteNote"
  | "styleBend"
  | "styleSlide"
  | "styleHammerOn"
  | "stylePullOff"
  | "styleHarmonic"
  | "styleTap"
  | "escape"
  | "addFrameAfter"
  | "addFrameBefore"
  | "addMeasureAfter"
  | "addMeasureBefore"
  | "deleteFrame";

export type Keymap = Record<string, EditorAction>;

export const defaultKeymap: Keymap = {
  // Navigation (vim hjkl)
  k: "moveUp",
  j: "moveDown",
  h: "moveLeft",
  l: "moveRight",
  b: "prevMeasureStart",
  w: "nextMeasureStart",

  // Selection (Shift+H/L)
  H: "selectLeft",
  L: "selectRight",

  // Fret entry (number keys)
  "0": "fretDigit0",
  "1": "fretDigit1",
  "2": "fretDigit2",
  "3": "fretDigit3",
  "4": "fretDigit4",
  "5": "fretDigit5",
  "6": "fretDigit6",
  "7": "fretDigit7",
  "8": "fretDigit8",
  "9": "fretDigit9",

  // Note operations
  x: "clearNote",
  m: "muteNote",

  // Note styles
  z: "styleBend",
  s: "styleSlide",
  v: "styleHammerOn",
  p: "stylePullOff",
  n: "styleHarmonic",
  t: "styleTap",

  // Inserts (o/O = open frame, {/} = open measure)
  o: "addFrameAfter",
  O: "addFrameBefore",
  "}": "addMeasureAfter",
  "{": "addMeasureBefore",
  X: "deleteFrame",

  // Escape
  Escape: "escape",
};
