import type { FrameType, TrackType } from "../shared/types/tab.types";
import { FRET_EMPTY, FRET_MUTED } from "../shared/types/consts";
import { PITCH_CLASS_NAMES, absoluteSemitone } from "./pitch";
import type { TabPositionType } from "../shared/types/utilities.types";

/**
 * Scientific pitch name (e.g. "E4") for a fretted note. `openOctave` is the octave of
 * that string played open, which the track stores per string.
 */
export function absoluteNote(
  openNote: Parameters<typeof absoluteSemitone>[0],
  fret: number,
  openOctave: number,
): string {
  const semitones = absoluteSemitone(openNote, fret, 0);
  const pitchClass = ((semitones % 12) + 12) % 12;
  const octave = openOctave + Math.floor(semitones / 12);
  return `${PITCH_CLASS_NAMES[pitchClass]}${octave}`;
}

/** The notes a frame actually sounds. Empty and muted strings contribute nothing. */
export function frameToNotes(frame: FrameType, track: TrackType): string[] {
  return frame.notes
    .flatMap((note, i) => {
      if (note.fret === FRET_EMPTY || note.fret === FRET_MUTED) return [];
      const openNote = track.tuning[i];
      if (!openNote) return [];
      return [absoluteNote(openNote, note.fret, track.octaves[i] ?? 3)];
    });
}

export type ScheduledFrame = {
  frame: FrameType;
  /** Where the cursor goes when this frame sounds. */
  position: TabPositionType;
  /** Document-order index across the whole track — one step per frame. */
  step: number;
};

/**
 * Flattens a track into playback order, recording each frame's position so the cursor
 * can follow. Walking sections and measures here (rather than at schedule time) keeps
 * the scheduler a plain loop over steps.
 */
export function flattenTrack(track: TrackType): ScheduledFrame[] {
  const flattened: ScheduledFrame[] = [];
  track.body.sections.forEach((section, sectionIndex) => {
    section.measures.forEach((measure, measureIndex) => {
      measure.forEach((frame, frameIndex) => {
        flattened.push({
          frame,
          position: {
            section: sectionIndex,
            measure: measureIndex,
            frame: frameIndex,
            string: 0,
          },
          step: flattened.length,
        });
      });
    });
  });
  return flattened;
}

/** Longest track, in steps — how far playback runs. */
export function trackLength(tracks: TrackType[]): number {
  return tracks.reduce(
    (longest, track) => Math.max(longest, flattenTrack(track).length),
    0,
  );
}
