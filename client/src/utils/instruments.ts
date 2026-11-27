import type * as Tone from "tone";
import type { ToneModule } from "./toneLoader";

export type InstrumentVoiceId =
  | "guitar"
  | "bass"
  | "ukulele"
  | "electricPiano"
  | "fm"
  | "pad";

/**
 * Tone's own option types demand every nested field; presets only ever set a few, so
 * they are declared against a deep-partial view and cast at the constructor.
 */
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/**
 * A playable voice. The caller doesn't care whether it is a plucked-string model or a
 * subtractive synth underneath — it just triggers notes and disposes when done.
 */
export type VoiceHandle = {
  triggerAttackRelease: (
    notes: string | string[],
    duration: number,
    time: number,
  ) => void;
  /** Everything the voice owns, disposed together. */
  dispose: () => void;
};

/**
 * Plucked strings (guitar, bass, ukulele) use Karplus–Strong synthesis — Tone.PluckSynth
 * — which models a struck string rather than approximating one with an oscillator and an
 * envelope. It sounds far more like the real thing, and its sharp transient keeps fast
 * passages rhythmically crisp instead of smearing. No samples to load.
 */
type PluckPreset = {
  kind: "pluck";
  /** Noise burst that excites the string — higher is a brighter, harder pluck. */
  attackNoise: number;
  /** Damping filter in the feedback loop; higher keeps more highs and rings longer. */
  dampening: number;
  /** Feedback amount (0–1); higher sustains longer. */
  resonance: number;
  /** Cutoff of the tone-shaping filter after the string, in Hz. */
  cutoff: number;
  volume: number;
};

/** Keyboard/pad voices stay subtractive — there's no string to model. */
type SynthPreset = {
  kind: "synth";
  options: DeepPartial<Tone.SynthOptions>;
  cutoff: number;
  volume: number;
};

const VOICES: Record<InstrumentVoiceId, PluckPreset | SynthPreset> = {
  guitar: {
    kind: "pluck",
    // Warmer and rounder than a bright acoustic: a softer pluck (less attack noise), a
    // darker string (lower dampening), and a filter that rolls off the metallic highs.
    attackNoise: 0.5,
    dampening: 2600,
    resonance: 0.93,
    cutoff: 3400,
    volume: -5,
  },
  bass: {
    kind: "pluck",
    attackNoise: 0.7,
    dampening: 1500,
    resonance: 0.96,
    cutoff: 2600,
    volume: -3,
  },
  ukulele: {
    kind: "pluck",
    attackNoise: 1.1,
    dampening: 5200,
    resonance: 0.9,
    cutoff: 7000,
    volume: -8,
  },
  electricPiano: {
    kind: "synth",
    options: {
      oscillator: { type: "fmsine", modulationType: "sine", harmonicity: 3.01 },
      envelope: { attack: 0.006, decay: 1.6, sustain: 0.12, release: 1.4 },
    },
    cutoff: 5000,
    volume: -11,
  },
  fm: {
    kind: "synth",
    options: {
      oscillator: { type: "fmsine", modulationType: "square", harmonicity: 1.5 },
      envelope: { attack: 0.02, decay: 0.6, sustain: 0.3, release: 1.2 },
    },
    cutoff: 6000,
    volume: -14,
  },
  pad: {
    kind: "synth",
    options: {
      oscillator: { type: "fatsawtooth", count: 3, spread: 30 },
      envelope: { attack: 0.6, decay: 1.4, sustain: 0.6, release: 2.4 },
    },
    cutoff: 2400,
    volume: -18,
  },
};

/** One PluckSynth is monophonic, so a chord needs several. Enough for a six-string
 * chord plus a little overlap into the next one. */
const PLUCK_POLYPHONY = 10;

/** Maps a track's free-text instrument onto a voice, falling back to guitar. */
export function voiceForInstrument(instrument: string): InstrumentVoiceId {
  const normalized = instrument.toLowerCase();
  if (normalized in VOICES) return normalized as InstrumentVoiceId;
  if (normalized.includes("bass")) return "bass";
  if (normalized.includes("uke") || normalized.includes("ukulele")) return "ukulele";
  return "guitar";
}

/**
 * Builds a voice and its output chain. `destination` lets several voices share one FX
 * bus (playback mixes tracks into a common reverb); omit it to go straight out.
 *
 * The tone module is passed in rather than imported, so this file stays free of a
 * static dependency on it and can be tree-shaken out of the initial bundle.
 */
export function createVoice(
  tone: ToneModule,
  id: InstrumentVoiceId,
  destination?: Tone.InputNode,
): VoiceHandle {
  const preset = VOICES[id] ?? VOICES.guitar;
  const filter = new tone.Filter(preset.cutoff, "lowpass");
  if (destination) filter.connect(destination);
  else filter.toDestination();

  if (preset.kind === "pluck") {
    // A round-robin pool of monophonic strings. Each note of a chord lands on the next
    // string; retriggering an older one just cuts it, which is what caps the ring.
    const strings = Array.from({ length: PLUCK_POLYPHONY }, () => {
      const pluck = new tone.PluckSynth({
        attackNoise: preset.attackNoise,
        dampening: preset.dampening,
        resonance: preset.resonance,
      });
      pluck.volume.value = preset.volume;
      pluck.connect(filter);
      return pluck;
    });

    let next = 0;
    return {
      triggerAttackRelease: (notes, duration, time) => {
        const list = Array.isArray(notes) ? notes : [notes];
        for (const note of list) {
          strings[next % strings.length].triggerAttackRelease(note, duration, time);
          next++;
        }
      },
      dispose: () => {
        strings.forEach((string) => string.dispose());
        filter.dispose();
      },
    };
  }

  const synth = new tone.PolySynth(tone.Synth, preset.options as never);
  synth.volume.value = preset.volume;
  synth.connect(filter);
  return {
    triggerAttackRelease: (notes, duration, time) =>
      synth.triggerAttackRelease(notes, duration, time),
    dispose: () => {
      synth.dispose();
      filter.dispose();
    },
  };
}

export type FxBus = {
  input: Tone.InputNode;
  dispose: () => void;
};

/** A little room on the master bus — dry strings alone sound synthetic. */
export function createReverbBus(tone: ToneModule, wet = 0.18): FxBus {
  const reverb = new tone.Reverb({ decay: 2.2, wet });
  reverb.toDestination();
  return { input: reverb, dispose: () => reverb.dispose() };
}
