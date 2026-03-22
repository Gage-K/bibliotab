export type IdType = string;
export type TuningNoteType =
  | "A"
  | "A#"
  | "Ab"
  | "B"
  | "Bb"
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "Db"
  | "E"
  | "Eb"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "Gb";
export type TuningType = [
  TuningNoteType,
  TuningNoteType,
  TuningNoteType,
  TuningNoteType,
  TuningNoteType,
  TuningNoteType
];

export type NoteStyleType =
  | "none"
  | "hammerOn"
  | "pullOff"
  | "bend"
  | "slide"
  | "harmonic"
  | "tap";

export type NoteFretType = {
  fret: number;
  style: NoteStyleType;
};

export type FrameType = {
  id: string;
  notes: NoteFretType[];
};

export type MeasureType = FrameType[];

export type TabBodyType = MeasureType[];

export type TabDetailsType = {
  song: string;
  artist: string;
  creator: string;
  dateCreated: string;
  dateModified: string;
  tuning: TuningType;
};

export type EditorDetailsType = {
  id: string;
  artist: string;
  song: string;
  tuning: TuningType;
};

export type TabType = {
  id: IdType;
  details: TabDetailsType;
  body: TabBodyType;
};
