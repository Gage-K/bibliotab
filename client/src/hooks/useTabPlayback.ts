import { useCallback, useEffect, useRef, useState } from "react";
import { loadTone, peekTone } from "../utils/toneLoader";
import { frameToNotes, totalBeats, trackLength, withTiming } from "../utils/audio";
import {
  createReverbBus,
  createVoice,
  voiceForInstrument,
  type FxBus,
  type VoiceHandle,
} from "../utils/instruments";
import type { TrackType } from "@tablab/shared";
import type { TabPositionType } from "../shared/types/utilities.types";

/** Fraction of a frame a note rings for, so consecutive frames don't run together. */
const NOTE_LENGTH_RATIO = 0.9;

type PlaybackOptions = {
  tracks: TrackType[];
  /** Cursor updates follow this track; the others sound but don't move the cursor. */
  activeTrack: number;
  /** Tab tempo. Durations are in beats, so this is the only thing that scales time. */
  bpm: number;
  onStep: (position: TabPositionType) => void;
};

/**
 * Runs the transport through the tab, sounding every track at once.
 *
 * Scheduling is duration-driven: each frame is placed at its own absolute start time
 * (see withTiming), so a measure of four quarters and a measure of eight eighths take
 * the same wall-clock time. Tracks therefore stay aligned even when they subdivide
 * differently.
 */
export function useTabPlayback({
  tracks,
  activeTrack,
  bpm,
  onStep,
}: PlaybackOptions) {
  const [isPlaying, setIsPlaying] = useState(false);

  const voicesRef = useRef<VoiceHandle[]>([]);
  const busRef = useRef<FxBus | null>(null);

  // Read through refs inside scheduled callbacks: the transport outlives any single
  // render, and a stale closure would sound the tab as it was when play was pressed.
  const tracksRef = useRef(tracks);
  const activeTrackRef = useRef(activeTrack);
  const onStepRef = useRef(onStep);
  tracksRef.current = tracks;
  activeTrackRef.current = activeTrack;
  onStepRef.current = onStep;

  const totalSteps = trackLength(tracks);

  const teardown = useCallback(() => {
    // Unmount can happen without anything ever having played, in which case tone was
    // never loaded and there is no transport to stop.
    const tone = peekTone();
    tone?.getTransport().stop();
    tone?.getTransport().cancel();
    voicesRef.current.forEach((voice) => voice.dispose());
    voicesRef.current = [];
    busRef.current?.dispose();
    busRef.current = null;
  }, []);

  // Disposing on unmount matters more than usual here: the nodes live in the audio
  // graph, not in React, so nothing else would ever collect them.
  useEffect(() => teardown, [teardown]);

  const stop = useCallback(() => {
    const tone = peekTone();
    tone?.getTransport().stop();
    tone?.getTransport().cancel();
    setIsPlaying(false);
  }, []);

  const play = useCallback(async () => {
    // tone is ~66 kB gzipped and useless before a gesture, so it is fetched here rather
    // than bundled into the initial load. The import is cached after the first play.
    const Tone = await loadTone();

    // The audio context can only be unlocked from a user gesture, so this must run in
    // the click handler's own call stack.
    await Tone.start();

    const currentTracks = tracksRef.current;
    if (currentTracks.length === 0) return;

    // Cancel first: without it a second play stacks a duplicate set of events on the
    // transport and every note fires twice.
    Tone.getTransport().cancel();
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;

    if (!busRef.current) busRef.current = createReverbBus(Tone);
    voicesRef.current.forEach((voice) => voice.dispose());
    voicesRef.current = currentTracks.map((track) =>
      createVoice(Tone, voiceForInstrument(track.instrument), busRef.current!.input),
    );

    currentTracks.forEach((track, trackIndex) => {
      const voice = voicesRef.current[trackIndex];
      const isActive = trackIndex === activeTrackRef.current;

      withTiming(track, bpm).forEach(({ frame, position, start, seconds }) => {
        Tone.getTransport().schedule((time) => {
          const notes = frameToNotes(frame, track);
          if (notes.length > 0) {
            voice.triggerAttackRelease(notes, seconds * NOTE_LENGTH_RATIO, time);
          }
          if (isActive) {
            // Draw defers to the animation frame nearest `time`, which keeps the
            // cursor visually in step without blocking the audio thread.
            Tone.getDraw().schedule(() => {
              onStepRef.current(position);
            }, time);
          }
        }, start);
      });
    });

    const endsAt = totalBeats(currentTracks) * (60 / bpm);
    Tone.getTransport().schedule(() => {
      Tone.getDraw().schedule(() => setIsPlaying(false), Tone.now());
      Tone.getTransport().stop();
    }, endsAt);

    setIsPlaying(true);
    Tone.getTransport().start();
  }, [bpm]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      void play();
    }
  }, [isPlaying, play, stop]);

  // Editing the tab or the tempo mid-playback would leave the transport running the
  // events scheduled from the old state, so stop rather than silently diverging.
  useEffect(() => {
    if (isPlaying) stop();
    // Deliberately keyed on bpm alone: re-running on `tracks` would stop playback on
    // every cursor move, since positions live in the same state object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm]);

  return { isPlaying, play, stop, toggle, totalSteps };
}
