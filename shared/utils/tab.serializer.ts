import { randomUUID } from "crypto";
import {
  TabEntity,
  TabType,
  TabResponse,
  CreateTabDto,
  UpdateTabDto,
  TabBodyType,
  MeasureType,
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
 * Validates that a TabBodyType is within reasonable size limits
 * Returns error message if invalid, null if valid
 */
export function validateTabSize(
  body: any
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
  const MAX_STRINGS = 12;

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

        if (frame.notes.length < 1 || frame.notes.length > MAX_STRINGS) {
          return {
            valid: false,
            error: `Frame ${j} in measure ${i} of section ${s} must have between 1 and ${MAX_STRINGS} notes`,
          };
        }
      }
    }
  }

  return { valid: true };
}
