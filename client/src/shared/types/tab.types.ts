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
  /**
   * Length in beats — quarter = 1, eighth = 0.5, dotted quarter = 1.5. Beats rather
   * than seconds so changing the tempo never means editing frames.
   *
   * Optional because frames written before the rhythm model have none; read it through
   * DEFAULT_FRAME_DURATION rather than directly.
   */
  duration?: number;
};

export type MeasureType = FrameType[];

export type SectionType = { id: string; name: string; measures: MeasureType[] };

export type TabBodyType = {
  sections: SectionType[];
};

// Tuning lives on the track, not here — each instrument tunes independently.
/** Beats per measure and the note value that gets the beat, e.g. [4, 4]. */
export type TimeSignatureType = [number, number];

export type TabDetailsType = {
  song: string;
  artist: string;
  creator: string;
  dateCreated: string;
  dateModified: string;
  bpm: number;
  timeSignature: TimeSignatureType;
};

export type EditorDetailsType = {
  id: string;
  artist: string;
  song: string;
  bpm: number;
  timeSignature: TimeSignatureType;
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
