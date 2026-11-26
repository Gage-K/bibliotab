import { nanoid } from "nanoid";
import type { TrackType } from "@tablab/shared";
import {
  DEFAULT_STRING_COUNT,
  DEFAULT_TUNING,
  octavesForTuning,
  reconcileOctaves,
} from "@tablab/shared";
import { createEmptyBody } from "./tabOperations";

// Tuning and octave math (deriveOctaves, reconcileOctaves, midiNumber, presets) and the
// normalizing of stored tab data live in @tablab/shared, so the client and the server
// read a tab the same way. What stays here is editor-only: building a fresh track.

export function createTrack(options: Partial<TrackType> = {}): TrackType {
  const tuning = options.tuning ?? DEFAULT_TUNING;
  return {
    id: nanoid(),
    name: options.name ?? "Track 1",
    instrument: options.instrument ?? "guitar",
    tuning,
    octaves: options.octaves
      ? reconcileOctaves(tuning, options.octaves)
      : octavesForTuning(tuning),
    body: options.body ?? createEmptyBody(tuning.length),
  };
}

/** String count of a track — its tuning is the source of truth. */
export function trackStringCount(track: TrackType | undefined): number {
  return track?.tuning.length ?? DEFAULT_STRING_COUNT;
}
