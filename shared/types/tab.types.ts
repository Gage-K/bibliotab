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

// Tab metadata
export type TabDetailsType = {
  song: string;
  artist: string;
  creator: string;
  dateCreated: string;
  dateModified: string;
  tuning: TuningType;
};

export type SectionType = { id: string; name: string; measures: MeasureType[] };

export type TabBodyType = {
  sections: SectionType[];
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
 * - tuning: JSON array of open notes, one per string
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
