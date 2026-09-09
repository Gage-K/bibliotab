import { randomUUID } from "crypto";
import {
  DEFAULT_BPM,
  DEFAULT_TIME_SIGNATURE,
  MAX_BPM,
  MAX_STRINGS,
  MAX_TRACKS,
  MIN_BPM,
  MIN_STRINGS,
  TUNING_NOTES,
} from "../constants/tab.constants";
import {
  TabEntity,
  TabType,
  TabResponse,
  CreateTabDto,
  UpdateTabDto,
  TabBodyType,
  TabTracksType,
  TrackType,
  MeasureType,
  TuningType,
  TuningNoteType,
} from "../types/tab.types";
import { octavesForTuning, reconcileOctaves, DEFAULT_TUNING } from "./tuning";

export const DEFAULT_SECTION_NAME = "Section 1";
export const DEFAULT_TRACK_NAME = "Track 1";
export const DEFAULT_INSTRUMENT = "guitar";

/**
 * Upgrades a legacy flat `MeasureType[]` tab body into the sectioned shape by
 * wrapping it in a single default section. Already-sectioned bodies pass through
 * untouched.
 *
 * The 0001 migration backfills every stored blob, so this is belt & suspenders for
 * anything that slips past it (an old client posting a flat array, a restored dump).
 */
export function normalizeTabBody(raw: unknown): TabBodyType {
  if (Array.isArray(raw)) {
    return {
      sections: [
        {
          id: randomUUID(),
          name: DEFAULT_SECTION_NAME,
          measures: raw as MeasureType[],
        },
      ],
    };
  }

  if (raw && typeof raw === "object" && Array.isArray((raw as TabBodyType).sections)) {
    return raw as TabBodyType;
  }

  return { sections: [] };
}

/**
 * Upgrades any stored `tab_data` into the tracked shape. Three generations of the blob
 * exist in the wild and all three arrive here:
 *
 *   1. `MeasureType[]`          — pre-sections
 *   2. `{ sections: [...] }`    — sections, pre-tracks
 *   3. `{ tracks: [...] }`      — current
 *
 * `fallbackTuning` is the row's legacy `tuning` column, which is where the tuning
 * lived before it moved onto the track.
 */
export function normalizeTabTracks(
  raw: unknown,
  fallbackTuning: TuningType = DEFAULT_TUNING
): TabTracksType {
  if (
    raw &&
    typeof raw === "object" &&
    Array.isArray((raw as TabTracksType).tracks)
  ) {
    return {
      tracks: (raw as TabTracksType).tracks.map((track, i) =>
        normalizeTrack(track, i, fallbackTuning)
      ),
    };
  }

  // Generations 1 and 2 both reduce to a single track holding the whole body.
  return {
    tracks: [
      normalizeTrack(
        { body: normalizeTabBody(raw) } as Partial<TrackType>,
        0,
        fallbackTuning
      ),
    ],
  };
}

/** Fills in anything a stored track is missing, so downstream code can assume it. */
function normalizeTrack(
  track: Partial<TrackType>,
  index: number,
  fallbackTuning: TuningType
): TrackType {
  const tuning =
    Array.isArray(track.tuning) && track.tuning.length > 0
      ? track.tuning
      : fallbackTuning;

  return {
    id: track.id ?? randomUUID(),
    name: track.name ?? `Track ${index + 1}`,
    instrument: track.instrument ?? DEFAULT_INSTRUMENT,
    tuning,
    octaves: track.octaves
      ? reconcileOctaves(tuning, track.octaves)
      : octavesForTuning(tuning),
    body: normalizeTabBody(track.body),
  };
}

/**
 * Converts a database TabEntity to a frontend-friendly TabResponse
 */
export function tabEntityToResponse(entity: TabEntity): TabResponse {
  return {
    id: entity.id,
    details: {
      song: entity.tab_name,
      artist: entity.tab_artist,
      creator: entity.user_id,
      dateCreated: entity.created_at.toISOString(),
      dateModified: entity.modified_at.toISOString(),
      // Columns are nullable on rows written before the rhythm migration ran.
      bpm: entity.bpm ?? DEFAULT_BPM,
      timeSignature: entity.time_signature ?? DEFAULT_TIME_SIGNATURE,
    },
    tracks: normalizeTabTracks(entity.tab_data, entity.tuning).tracks,
  };
}

/**
 * Converts an array of TabEntities to TabResponses
 */
export function tabEntitiesToResponses(entities: TabEntity[]): TabResponse[] {
  return entities.map(tabEntityToResponse);
}

/**
 * Extracts database fields from a CreateTabDto
 */
export function createDtoToEntity(
  userId: string,
  dto: CreateTabDto
): Omit<TabEntity, "id" | "created_at" | "modified_at"> {
  const tab_data = normalizeTabTracks(dto.tab_data, dto.tuning);
  return {
    user_id: userId,
    tab_name: dto.tab_name,
    tab_artist: dto.tab_artist,
    // The column is NOT NULL and no longer read; mirror track 0 to keep it honest.
    tuning: tab_data.tracks[0]?.tuning ?? dto.tuning,
    tab_data,
    bpm: dto.bpm ?? DEFAULT_BPM,
    time_signature: dto.time_signature ?? DEFAULT_TIME_SIGNATURE,
  };
}

/**
 * Validates a whole `{ tracks: [...] }` blob: every track's tuning, and every track's
 * body against that track's own string count.
 */
export function validateTabTracks(
  data: any
): { valid: false; error: string } | { valid: true } {
  if (!data || typeof data !== "object" || !Array.isArray(data.tracks)) {
    return {
      valid: false,
      error: "tab_data must be an object with a tracks array",
    };
  }

  if (data.tracks.length < 1 || data.tracks.length > MAX_TRACKS) {
    return {
      valid: false,
      error: `A tab must have between 1 and ${MAX_TRACKS} tracks`,
    };
  }

  for (let t = 0; t < data.tracks.length; t++) {
    const track = data.tracks[t];
    if (!track || typeof track !== "object") {
      return { valid: false, error: `Track ${t} must be an object` };
    }

    const tuningResult = validateTuning(track.tuning);
    if (!tuningResult.valid) {
      return { valid: false, error: `Track ${t}: ${tuningResult.error}` };
    }

    const bodyResult = validateTabSize(track.body, track.tuning.length);
    if (!bodyResult.valid) {
      return { valid: false, error: `Track ${t}: ${bodyResult.error}` };
    }
  }

  return { valid: true };
}

/**
 * Validates that a TabBodyType is within reasonable size limits.
 *
 * `expectedStringCount` (the tuning's length) is optional: when supplied, every frame
 * must have exactly that many notes, which is what keeps the note rows and the tuning
 * from drifting apart. Without it, frames only have to be a plausible width.
 */
export function validateTabSize(
  body: any,
  expectedStringCount?: number
): { valid: false; error: string } | { valid: true } {
  if (!body || typeof body !== "object" || !Array.isArray(body.sections)) {
    return {
      valid: false,
      error: "Tab body must be an object with a sections array",
    };
  }

  const MAX_SECTIONS = 100;
  const MAX_MEASURES = 500;
  const MAX_FRAMES_PER_MEASURE = 64;

  if (body.sections.length > MAX_SECTIONS) {
    return {
      valid: false,
      error: `Tab exceeds maximum of ${MAX_SECTIONS} sections`,
    };
  }

  let measureCount = 0;

  for (let s = 0; s < body.sections.length; s++) {
    const section = body.sections[s];
    if (
      !section ||
      typeof section !== "object" ||
      !Array.isArray(section.measures)
    ) {
      return {
        valid: false,
        error: `Section ${s} must be an object with a measures array`,
      };
    }

    measureCount += section.measures.length;
    if (measureCount > MAX_MEASURES) {
      return {
        valid: false,
        error: `Tab exceeds maximum of ${MAX_MEASURES} measures`,
      };
    }

    for (let i = 0; i < section.measures.length; i++) {
      const measure = section.measures[i];
      if (!Array.isArray(measure)) {
        return {
          valid: false,
          error: `Measure ${i} in section ${s} is not an array of frames`,
        };
      }

      if (measure.length > MAX_FRAMES_PER_MEASURE) {
        return {
          valid: false,
          error: `Measure ${i} in section ${s} exceeds maximum of ${MAX_FRAMES_PER_MEASURE} frames`,
        };
      }

      for (let j = 0; j < measure.length; j++) {
        const frame = measure[j];
        if (!frame || typeof frame !== "object" || !Array.isArray(frame.notes)) {
          return {
            valid: false,
            error: `Frame ${j} in measure ${i} of section ${s} must be an object with a notes array`,
          };
        }

        if (
          expectedStringCount !== undefined &&
          frame.notes.length !== expectedStringCount
        ) {
          return {
            valid: false,
            error: `Frame ${j} in measure ${i} of section ${s} has ${frame.notes.length} notes but the tuning has ${expectedStringCount} strings`,
          };
        }

        if (
          frame.notes.length < MIN_STRINGS ||
          frame.notes.length > MAX_STRINGS
        ) {
          return {
            valid: false,
            error: `Frame ${j} in measure ${i} of section ${s} must have between ${MIN_STRINGS} and ${MAX_STRINGS} notes`,
          };
        }
      }
    }
  }

  return { valid: true };
}

/**
 * Validates a tuning: an array of known note names, one per string.
 */
export function validateTuning(
  tuning: unknown
): { valid: false; error: string } | { valid: true } {
  if (!Array.isArray(tuning)) {
    return { valid: false, error: "tuning must be an array of note names" };
  }
  if (tuning.length < MIN_STRINGS || tuning.length > MAX_STRINGS) {
    return {
      valid: false,
      error: `tuning must have between ${MIN_STRINGS} and ${MAX_STRINGS} strings`,
    };
  }
  const unknown = tuning.find(
    (note) => !TUNING_NOTES.includes(note as TuningNoteType)
  );
  if (unknown !== undefined) {
    return { valid: false, error: `"${unknown}" is not a valid note name` };
  }
  return { valid: true };
}

/** Validates a `[beats, beatValue]` pair, e.g. [4, 4] or [6, 8]. */
export function validateTimeSignature(
  value: unknown
): { valid: false; error: string } | { valid: true } {
  if (!Array.isArray(value) || value.length !== 2) {
    return {
      valid: false,
      error: "time_signature must be a [beats, beatValue] pair",
    };
  }
  const [beats, beatValue] = value;
  if (!Number.isInteger(beats) || beats < 1 || beats > 32) {
    return { valid: false, error: "time signature beats must be 1-32" };
  }
  // Beat values are note denominators, so only powers of two make sense.
  if (![1, 2, 4, 8, 16, 32].includes(beatValue)) {
    return {
      valid: false,
      error: "time signature beat value must be 1, 2, 4, 8, 16 or 32",
    };
  }
  return { valid: true };
}

export function validateBpm(
  value: unknown
): { valid: false; error: string } | { valid: true } {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { valid: false, error: "bpm must be a number" };
  }
  if (value < MIN_BPM || value > MAX_BPM) {
    return { valid: false, error: `bpm must be between ${MIN_BPM} and ${MAX_BPM}` };
  }
  return { valid: true };
}
