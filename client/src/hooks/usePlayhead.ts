import { useEffect, useState } from "react";
import * as Tone from "tone";
import { secondsToTicks } from "../utils/timeline";

/**
 * Current playback position in ticks, sampled on animation frames.
 *
 * The transport is the clock — asking it where it is each frame keeps the playhead
 * exact, whereas driving it from scheduled callbacks would only move it at note onsets
 * and it would visibly stutter through long notes.
 */
export function usePlayhead(isPlaying: boolean, bpm: number): number | null {
  const [tick, setTick] = useState<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      setTick(null);
      return;
    }

    let frameId = 0;
    const sample = () => {
      setTick(secondsToTicks(Tone.getTransport().seconds, bpm));
      frameId = requestAnimationFrame(sample);
    };
    frameId = requestAnimationFrame(sample);

    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, bpm]);

  return tick;
}
