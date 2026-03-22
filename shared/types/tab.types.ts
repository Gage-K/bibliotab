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

// Tab metadata
export type TabDetailsType = {
  song: string;
  artist: string;
  creator: string;
  dateCreated: string;
  dateModified: string;
  tuning: TuningType;
};

// Complete tab document
export type TabType = {
  id: IdType;
  details: TabDetailsType;
  body: TabBodyType;
};


// ============================================================================
// DB Model
// ============================================================================

/**
 * Tab as stored in the database.
 * - tuning: JSON array of 6 notes
 * - tab_data: JSON blob containing TabBodyType
 */
export interface TabEntity {
  id: string;
  user_id: string;
  tab_name: string;
  tab_artist: string;
  tuning: TuningType;
  tab_data: TabBodyType;
  created_at: Date;
  modified_at: Date;
}

// ============================================================================
// DTOs
// ============================================================================

export type CreateTabDto = {
  tab_name: string;
  tab_artist: string;
  tuning: TuningType;
  tab_data: TabBodyType;
};

export type UpdateTabDto = {
  tab_name?: string;
  tab_artist?: string;
  tuning?: TuningType;
  tab_data?: TabBodyType;
};

// ============================================================================
// API Response ============================================================================

/**
 * Tab as returned by the API
 */
export type TabResponse = TabType;
