import type { TimeSignatureType, TrackType } from "../shared/types/tab.types";
import { flattenTrack, type ScheduledFrame } from "./audio";

/**
 * Ticks per beat. Frame durations are floats in beats, and summing floats to build a
 * shared grid is the classic way two tracks that should line up end up a hair apart.
 * Positions are therefore compared as integer ticks: 960 divides evenly by 2, 3, 4, 6
 * and 8, so every note value and triplet in practice lands exactly.
 */
export const TICKS_PER_BEAT = 960;

export function beatsToTicks(beats: number): number {
  return Math.round(beats * TICKS_PER_BEAT);
}

export function ticksToBeats(ticks: number): number {
  return ticks / TICKS_PER_BEAT;
}

export type TimelineFrame = ScheduledFrame & {
  /** Onset in ticks from the start of the tab. */
  startTick: number;
  /** Length in ticks. */
  durationTicks: number;
};

export type TrackTimeline = {
  track: TrackType;
  trackIndex: number;
  frames: TimelineFrame[];
  /** Where this track ends, in ticks. */
  endTick: number;
};

/** Places one track's frames on the shared tick axis. */
export function buildTrackTimeline(
  track: TrackType,
  trackIndex: number,
): TrackTimeline {
  let startTick = 0;
  const frames = flattenTrack(track).map((scheduled) => {
    const durationTicks = beatsToTicks(scheduled.beats);
    const frame = { ...scheduled, startTick, durationTicks };
    startTick += durationTicks;
    return frame;
  });

  return {
    track,
    trackIndex,
    frames,
    endTick: startTick,
  };
}

export function buildTimelines(tracks: TrackType[]): TrackTimeline[] {
  return tracks.map(buildTrackTimeline);
}

/**
 * Every distinct moment at which some track has a frame onset, in ticks.
 *
 * This is what replaces measure-index alignment: a guitar in eighths and a bass in
 * quarters produce different numbers of frames per measure, but their onsets land on a
 * common set of ticks, and the bass's simply coincide with every other guitar column.
 */
export function buildTimeGrid(timelines: TrackTimeline[]): number[] {
  const onsets = new Set<number>();
  for (const timeline of timelines) {
    for (const frame of timeline.frames) onsets.add(frame.startTick);
  }
  return [...onsets].sort((a, b) => a - b);
}

/** Total length of the longest track, in ticks. */
export function timelineEnd(timelines: TrackTimeline[]): number {
  return timelines.reduce((longest, timeline) => Math.max(longest, timeline.endTick), 0);
}

/**
 * Bar-line positions in ticks, from the tab's meter.
 *
 * Durations are counted in quarter-note beats, so a 6/8 bar is three of them, not six.
 */
export function barLineTicks(
  endTick: number,
  timeSignature: TimeSignatureType,
): number[] {
  const [beatsPerBar, beatValue] = timeSignature;
  const barBeats = beatsPerBar * (4 / beatValue);
  if (barBeats <= 0) return [];

  const barTicks = beatsToTicks(barBeats);
  const lines: number[] = [];
  for (let tick = 0; tick <= endTick; tick += barTicks) lines.push(tick);
  return lines;
}

/**
 * The frame sounding in a track at a given tick, or null if the track has ended.
 *
 * A track that holds a long note through several of another track's onsets stays on
 * that frame, which is what makes the playhead read correctly across tracks.
 */
export function frameAtTick(
  timeline: TrackTimeline,
  tick: number,
): TimelineFrame | null {
  for (const frame of timeline.frames) {
    if (tick >= frame.startTick && tick < frame.startTick + frame.durationTicks) {
      return frame;
    }
  }
  return null;
}

/** Converts elapsed playback seconds into ticks at a given tempo. */
export function secondsToTicks(seconds: number, bpm: number): number {
  return Math.round(((seconds * bpm) / 60) * TICKS_PER_BEAT);
}
