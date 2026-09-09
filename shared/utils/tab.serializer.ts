import { randomUUID } from "crypto";
import {
  MAX_STRINGS,
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
  MeasureType,
  TuningNoteType,
} from "../types/tab.types";

export const DEFAULT_SECTION_NAME = "Section 1";

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
      tuning: entity.tuning,
    },
    body: normalizeTabBody(entity.tab_data),
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
  return {
    user_id: userId,
    tab_name: dto.tab_name,
    tab_artist: dto.tab_artist,
    tuning: dto.tuning,
    tab_data: normalizeTabBody(dto.tab_data),
  };
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
