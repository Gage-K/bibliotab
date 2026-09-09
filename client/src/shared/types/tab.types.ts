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
/**
 * Open notes per string, index 0 = string 1 = highest-pitched. Length is the string
 * count, so a 4-string bass and a 7-string guitar are both just tunings.
 */
export type TuningType = TuningNoteType[];

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

export type SectionType = { id: string; name: string; measures: MeasureType[] };

export type TabBodyType = {
  sections: SectionType[];
};

// Tuning lives on the track, not here — each instrument tunes independently.
export type TabDetailsType = {
  song: string;
  artist: string;
  creator: string;
  dateCreated: string;
  dateModified: string;
};

export type EditorDetailsType = {
  id: string;
  artist: string;
  song: string;
};

/**
 * One instrument's part. A tab is a list of these; a plain guitar tab is a tab with a
 * single track. Mirrors TrackType in shared/types/tab.types.ts.
 */
export type TrackType = {
  id: string;
  name: string;
  instrument: string;
  tuning: TuningType;
  /** Octave of each open string, parallel to `tuning`. Playback needs absolute pitch. */
  octaves: number[];
  body: TabBodyType;
};

export type TabTracksType = {
  tracks: TrackType[];
};

export type TabType = {
  id: IdType;
  details: TabDetailsType;
  tracks: TrackType[];
};
