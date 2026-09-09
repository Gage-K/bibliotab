import * as Tone from "tone";

export type EngineVoiceId = "analog" | "fm" | "epiano";

export const ENGINE_VOICES: { id: EngineVoiceId; label: string }[] = [
  { id: "analog", label: "Analog" },
  { id: "fm", label: "FM" },
  { id: "epiano", label: "Electric piano" },
];

export type OrchidEngine = {
  voices: Record<EngineVoiceId, Tone.PolySynth>;
  bass: Tone.MonoSynth;
  /** 0-1 wet on the reverb/chorus send. */
  setAmbience: (amount: number) => void;
  setBassLevel: (db: number) => void;
  /** Cuts every ringing note. Used when the chord changes. */
  releaseAll: () => void;
  dispose: () => void;
};

/**
 * Builds the Orchid's sound engine: three selectable polyphonic voices through a
 * shared chorus + reverb, plus a dedicated monophonic bass that bypasses the ambience.
 *
 * The bass is kept dry and separate on purpose — running the low root through the same
 * reverb as the chord is what makes this kind of instrument sound muddy.
 */
export function createEngine(): OrchidEngine {
  const reverb = new Tone.Reverb({ decay: 3.4, wet: 0.3 }).toDestination();
  const chorus = new Tone.Chorus({ frequency: 1.2, depth: 0.5, wet: 0.3 })
    .connect(reverb)
    .start();
  const chordBus = new Tone.Gain(0.8).connect(chorus);

  const analog = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fatsawtooth", count: 3, spread: 24 },
    envelope: { attack: 0.02, decay: 0.35, sustain: 0.55, release: 1.4 },
  } as never).connect(chordBus);
  analog.volume.value = -14;

  const fm = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 2.5,
    modulationIndex: 6,
    envelope: { attack: 0.01, decay: 0.5, sustain: 0.35, release: 1.6 },
    modulationEnvelope: { attack: 0.02, decay: 0.4, sustain: 0.2, release: 1.2 },
  } as never).connect(chordBus);
  fm.volume.value = -16;

  const epiano = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fmsine", modulationType: "sine", harmonicity: 3.01 },
    envelope: { attack: 0.005, decay: 1.4, sustain: 0.08, release: 1.5 },
  } as never).connect(chordBus);
  epiano.volume.value = -11;

  const bass = new Tone.MonoSynth({
    oscillator: { type: "square" },
    filter: { Q: 2, type: "lowpass" },
    envelope: { attack: 0.01, decay: 0.4, sustain: 0.4, release: 0.8 },
    filterEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.2, baseFrequency: 120, octaves: 2.5 },
  } as never).toDestination();
  bass.volume.value = -16;

  const voices: Record<EngineVoiceId, Tone.PolySynth> = { analog, fm, epiano };

  return {
    voices,
    bass,
    setAmbience: (amount) => {
      const clamped = Math.min(1, Math.max(0, amount));
      reverb.wet.value = clamped;
      chorus.wet.value = clamped * 0.8;
    },
    setBassLevel: (db) => {
      bass.volume.value = db;
    },
    releaseAll: () => {
      Object.values(voices).forEach((voice) => voice.releaseAll());
      bass.triggerRelease();
    },
    dispose: () => {
      Object.values(voices).forEach((voice) => voice.dispose());
      bass.dispose();
      chordBus.dispose();
      chorus.dispose();
      reverb.dispose();
    },
  };
}
