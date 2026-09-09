import type { FrameType, TrackType } from "../shared/types/tab.types";
import { FRET_EMPTY, FRET_MUTED } from "../shared/types/consts";
import { PITCH_CLASS_NAMES, absoluteSemitone } from "./pitch";
import { frameDuration } from "./tabOperations";
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
  /** Beats from the start of the track to this frame's attack. */
  startBeat: number;
  /** This frame's length in beats. */
  beats: number;
};

/**
 * Flattens a track into playback order, recording each frame's position so the cursor
 * can follow. Walking sections and measures here (rather than at schedule time) keeps
 * the scheduler a plain loop over steps.
 */
export function flattenTrack(track: TrackType): ScheduledFrame[] {
  const flattened: ScheduledFrame[] = [];
  let startBeat = 0;

  track.body.sections.forEach((section, sectionIndex) => {
    section.measures.forEach((measure, measureIndex) => {
      measure.forEach((frame, frameIndex) => {
        const beats = frameDuration(frame);
        flattened.push({
          frame,
          position: {
            section: sectionIndex,
            measure: measureIndex,
            frame: frameIndex,
            string: 0,
          },
          step: flattened.length,
          startBeat,
          beats,
        });
        startBeat += beats;
      });
    });
  });

  return flattened;
}

/** Longest track, in steps. */
export function trackLength(tracks: TrackType[]): number {
  return tracks.reduce(
    (longest, track) => Math.max(longest, flattenTrack(track).length),
    0,
  );
}

/** Seconds one beat lasts at a given tempo. */
export function secondsPerBeat(bpm: number): number {
  return 60 / bpm;
}

export type TimedFrame = ScheduledFrame & {
  /** Seconds from the start of the track to this frame's attack. */
  start: number;
  /** This frame's length in seconds. */
  seconds: number;
};

/**
 * Places a track's frames on an absolute seconds axis. This is the function the whole
 * rhythm model exists for: playback schedules against it, and it is what lets a frame
 * be located in time rather than by index.
 *
 * Durations are stored in beats, so changing the tempo rescales everything here without
 * touching a single frame.
 */
export function withTiming(track: TrackType, bpm: number): TimedFrame[] {
  const spb = secondsPerBeat(bpm);
  return flattenTrack(track).map((scheduled) => ({
    ...scheduled,
    start: scheduled.startBeat * spb,
    seconds: scheduled.beats * spb,
  }));
}

/** Total length of the longest track, in beats. */
export function totalBeats(tracks: TrackType[]): number {
  return tracks.reduce((longest, track) => {
    const frames = flattenTrack(track);
    const last = frames[frames.length - 1];
    return Math.max(longest, last ? last.startBeat + last.beats : 0);
  }, 0);
}
