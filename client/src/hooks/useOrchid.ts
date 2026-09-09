import { useCallback, useEffect, useRef, useState } from "react";
import { loadTone, peekTone } from "../utils/toneLoader";
import {
  applyKeyLock,
  chordName,
  EXTENSION_QUALITIES,
  TRIAD_QUALITIES,
  type ChordSpec,
  type QualityId,
} from "../utils/orchid/buildChord";
import { bassNote, voiceChord } from "../utils/orchid/voice";
import { createEngine, type EngineVoiceId, type OrchidEngine } from "../utils/orchid/engine";
import {
  performChord,
  type PerformanceHandle,
  type PerformanceModeId,
} from "../utils/orchid/perform";

export type OrchidState = {
  qualities: QualityId[];
  keyLock: number | null;
  spread: number;
  inversion: number;
  baseOctave: number;
  mode: PerformanceModeId;
  voice: EngineVoiceId;
  ambience: number;
  bassEnabled: boolean;
  bpm: number;
};

const INITIAL_STATE: OrchidState = {
  qualities: ["major"],
  keyLock: null,
  spread: 0.35,
  inversion: 0,
  baseOctave: 3,
  mode: "strum",
  voice: "analog",
  ambience: 0.3,
  bassEnabled: true,
  bpm: 96,
};

export function useOrchid() {
  const [state, setState] = useState<OrchidState>(INITIAL_STATE);
  const [lastChord, setLastChord] = useState<{ name: string; notes: string[] } | null>(
    null,
  );

  const engineRef = useRef<OrchidEngine | null>(null);
  const handleRef = useRef<PerformanceHandle | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // The engine builds real audio nodes, so it is created on first play (after the
  // context is unlocked) rather than on mount, and torn down explicitly.
  useEffect(
    () => () => {
      handleRef.current?.stop();
      engineRef.current?.dispose();
      engineRef.current = null;
    },
    [],
  );

  useEffect(() => {
    engineRef.current?.setAmbience(state.ambience);
  }, [state.ambience]);

  const update = useCallback((patch: Partial<OrchidState>) => {
    setState((previous) => ({ ...previous, ...patch }));
  }, []);

  /**
   * Selecting a triad quality replaces the current one — a chord can't be both major
   * and diminished — while extensions stack, which is what makes holding Minor and 9
   * together mean a minor ninth.
   */
  const toggleQuality = useCallback((quality: QualityId) => {
    setState((previous) => {
      if (TRIAD_QUALITIES.includes(quality)) {
        return {
          ...previous,
          qualities: [
            quality,
            ...previous.qualities.filter((q) => EXTENSION_QUALITIES.includes(q)),
          ],
        };
      }

      const held = previous.qualities.includes(quality);
      return {
        ...previous,
        qualities: held
          ? previous.qualities.filter((q) => q !== quality)
          : [...previous.qualities, quality],
      };
    });
  }, []);

  const play = useCallback(async (rootPc: number) => {
    // tone is fetched on the first play rather than bundled; the import is cached
    // afterwards, so later presses are synchronous in practice.
    const Tone = await loadTone();

    // The audio context only unlocks from a user gesture, so this stays in the
    // handler's own call stack.
    await Tone.start();

    if (!engineRef.current) {
      engineRef.current = createEngine(Tone);
      engineRef.current.setAmbience(stateRef.current.ambience);
    }
    const engine = engineRef.current;
    const current = stateRef.current;

    // A previous arp or pattern would otherwise keep looping the old chord underneath
    // the new one.
    handleRef.current?.stop();
    handleRef.current = null;
    engine.releaseAll();

    const rawSpec: ChordSpec = { rootPc, qualities: current.qualities };
    const spec =
      current.keyLock === null ? rawSpec : applyKeyLock(rawSpec, current.keyLock);

    const notes = voiceChord(spec, {
      spread: current.spread,
      inversion: current.inversion,
      baseOctave: current.baseOctave,
    });

    Tone.getTransport().bpm.value = current.bpm;

    handleRef.current = performChord(current.mode, {
      tone: Tone,
      synth: engine.voices[current.voice],
      notes,
      bpm: current.bpm,
      intensity: current.spread,
    });

    if (current.bassEnabled) {
      engine.bass.triggerAttackRelease(
        bassNote(spec, current.baseOctave),
        (60 / current.bpm) * 2,
      );
    }

    setLastChord({ name: chordName(spec), notes });
  }, []);

  const release = useCallback(() => {
    handleRef.current?.stop();
    handleRef.current = null;
    engineRef.current?.releaseAll();
    // Release runs on unmount too, which can happen before anything ever played.
    const tone = peekTone();
    tone?.getTransport().stop();
    tone?.getTransport().cancel();
  }, []);

  return { state, update, toggleQuality, play, release, lastChord };
}
