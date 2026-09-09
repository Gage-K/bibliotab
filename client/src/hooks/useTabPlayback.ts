import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { flattenTrack, frameToNotes, trackLength } from "../utils/audio";
import {
  createReverbBus,
  createVoice,
  voiceForInstrument,
  type FxBus,
  type VoiceHandle,
} from "../utils/instruments";
import type { TrackType } from "../shared/types/tab.types";
import type { TabPositionType } from "../shared/types/utilities.types";

export const MIN_BPM = 30;
export const MAX_BPM = 300;
export const DEFAULT_BPM = 90;

/** Fraction of a step a note rings for, so consecutive frames don't run together. */
const NOTE_LENGTH_RATIO = 0.9;

type PlaybackOptions = {
  tracks: TrackType[];
  /** Cursor updates follow this track; the others sound but don't move the cursor. */
  activeTrack: number;
  onStep: (position: TabPositionType) => void;
};

/**
 * Steps the transport through the tab one frame at a time, sounding every track at
 * once.
 *
 * Frames have no duration yet, so every frame is one beat and tracks line up by frame
 * index. That is fine while all tracks subdivide the same way; aligning them on
 * absolute time needs the rhythm model.
 */
export function useTabPlayback({ tracks, activeTrack, onStep }: PlaybackOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(DEFAULT_BPM);

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
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    voicesRef.current.forEach((voice) => voice.dispose());
    voicesRef.current = [];
    busRef.current?.dispose();
    busRef.current = null;
  }, []);

  // Disposing on unmount matters more than usual here: the nodes live in the audio
  // graph, not in React, so nothing else would ever collect them.
  useEffect(() => teardown, [teardown]);

  const stop = useCallback(() => {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    setIsPlaying(false);
  }, []);

  const play = useCallback(async () => {
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

    if (!busRef.current) busRef.current = createReverbBus();
    voicesRef.current.forEach((voice) => voice.dispose());
    voicesRef.current = currentTracks.map((track) =>
      createVoice(voiceForInstrument(track.instrument), busRef.current!.input),
    );

    const stepSeconds = 60 / bpm;
    const noteSeconds = stepSeconds * NOTE_LENGTH_RATIO;

    currentTracks.forEach((track, trackIndex) => {
      const voice = voicesRef.current[trackIndex];
      const isActive = trackIndex === activeTrackRef.current;

      flattenTrack(track).forEach(({ frame, position, step }) => {
        const at = step * stepSeconds;
        Tone.getTransport().schedule((time) => {
          const notes = frameToNotes(frame, track);
          if (notes.length > 0) {
            voice.synth.triggerAttackRelease(notes, noteSeconds, time);
          }
          if (isActive) {
            // Draw defers to the animation frame nearest `time`, which keeps the
            // cursor visually in step without blocking the audio thread.
            Tone.getDraw().schedule(() => onStepRef.current(position), time);
          }
        }, at);
      });
    });

    const endsAt = trackLength(currentTracks) * stepSeconds;
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

  const changeBpm = useCallback(
    (next: number) => {
      const clamped = Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(next)));
      setBpm(clamped);
      // Rescheduling mid-playback would restart the tab; the new tempo applies on the
      // next play instead.
      if (isPlaying) stop();
    },
    [isPlaying, stop],
  );

  return { isPlaying, bpm, setBpm: changeBpm, play, stop, toggle, totalSteps };
}
