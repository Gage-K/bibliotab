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
   * Optional on the type because rows written before the rhythm migration have no
   * duration; read it through DEFAULT_FRAME_DURATION rather than directly.
   */
  duration?: number;
};

export type MeasureType = FrameType[];

/** Beats per measure and the note value that gets the beat, e.g. [4, 4]. */
export type TimeSignatureType = [number, number];

// Tab metadata. Tuning lives on the track, not here — each instrument tunes
// independently.
export type TabDetailsType = {
  song: string;
  artist: string;
  creator: string;
  dateCreated: string;
  dateModified: string;
  bpm: number;
  timeSignature: TimeSignatureType;
};

export type SectionType = { id: string; name: string; measures: MeasureType[] };

export type TabBodyType = {
  sections: SectionType[];
};

/**
 * One instrument's part. A tab is a list of these; a plain guitar tab is a tab with a
 * single track.
 */
export type TrackType = {
  id: string;
  /** Display name, e.g. "Rhythm guitar". Distinct from `instrument`. */
  name: string;
  /** Instrument family — "guitar" | "bass" | "ukulele" | ... Drives the sound preset. */
  instrument: string;
  tuning: TuningType;
  /**
   * Octave of each open string, parallel to `tuning`. Note names alone give pitch
   * classes, which is enough to name a chord but not to sound one, so playback needs
   * absolute pitch.
   */
  octaves: number[];
  body: TabBodyType;
};

/** The shape stored in `tabs.tab_data`. */
export type TabTracksType = {
  tracks: TrackType[];
};

// Complete tab document
export type TabType = {
  id: IdType;
  details: TabDetailsType;
  tracks: TrackType[];
  /** Freeform markdown notes for the tab. */
  notes: string;
};

// ============================================================================
// DB Model
// ============================================================================

/**
 * Tab as stored in the database.
 * - tab_data: JSON blob containing TabTracksType
 * - tuning: vestigial. Tuning moved onto each track in the tracks migration; the
 *   column is NOT NULL, so it is still written as a mirror of `tracks[0].tuning` and
 *   never read back. Drop it in a follow-up migration.
 */
export interface TabEntity {
  id: string;
  user_id: string;
  tab_name: string;
  tab_artist: string;
  tuning: TuningType;
  tab_data: TabTracksType;
  bpm: number;
  time_signature: TimeSignatureType;
  notes: string;
  created_at: Date;
  modified_at: Date;
}

// ============================================================================
// DTOs
// ============================================================================

export type CreateTabDto = {
  tab_name: string;
  tab_artist: string;
  /** Mirrors tracks[0].tuning; see the note on TabEntity. */
  tuning: TuningType;
  tab_data: TabTracksType;
  bpm?: number;
  time_signature?: TimeSignatureType;
  notes?: string;
};

export type UpdateTabDto = {
  tab_name?: string;
  tab_artist?: string;
  tuning?: TuningType;
  tab_data?: TabTracksType;
  bpm?: number;
  time_signature?: TimeSignatureType;
  notes?: string;
};

// ============================================================================
// API Response ============================================================================

/**
 * Tab as returned by the API
 */
export type TabResponse = TabType;
