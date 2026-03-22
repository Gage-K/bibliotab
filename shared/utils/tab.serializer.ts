import {
  TabEntity,
  TabType,
  TabResponse,
  CreateTabDto,
  UpdateTabDto,
} from "../types/tab.types";

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
    body: entity.tab_data,
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
    tab_data: dto.tab_data,
  };
}

/**
 * Validates that a TabBodyType is within reasonable size limits
 * Returns error message if invalid, null if valid
 */
export function validateTabSize(
  body: any
): { valid: false; error: string } | { valid: true } {
  if (!Array.isArray(body)) {
    return { valid: false, error: "Tab body must be an array of measures" };
  }

  const MAX_MEASURES = 500;
  const MAX_FRAMES_PER_MEASURE = 64;

  if (body.length > MAX_MEASURES) {
    return {
      valid: false,
      error: `Tab exceeds maximum of ${MAX_MEASURES} measures`,
    };
  }

  for (let i = 0; i < body.length; i++) {
    const measure = body[i];
    if (!Array.isArray(measure)) {
      return {
        valid: false,
        error: `Measure ${i} is not an array of frames`,
      };
    }

    if (measure.length > MAX_FRAMES_PER_MEASURE) {
      return {
        valid: false,
        error: `Measure ${i} exceeds maximum of ${MAX_FRAMES_PER_MEASURE} frames`,
      };
    }

    for (let j = 0; j < measure.length; j++) {
      const frame = measure[j];
      if (!frame || typeof frame !== "object" || !Array.isArray(frame.notes) || frame.notes.length !== 6) {
        return {
          valid: false,
          error: `Frame ${j} in measure ${i} must be an object with a notes array of 6 notes`,
        };
      }
    }
  }

  return { valid: true };
}
