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

export type VoiceHandle = {
  synth: Tone.PolySynth;
  /** Everything the voice owns, disposed together. */
  dispose: () => void;
};

/**
 * Synth presets. A plucked string is mostly a fast attack and a decaying envelope over
 * a bright-ish oscillator; the differences between these are mostly envelope shape and
 * how much high end survives the filter.
 */
const VOICES: Record<
  InstrumentVoiceId,
  {
    options: DeepPartial<Tone.SynthOptions>;
    /** Cutoff of the per-voice tone-shaping filter, in Hz. */
    cutoff: number;
    volume: number;
  }
> = {
  guitar: {
    options: {
      oscillator: { type: "fmsawtooth", modulationType: "sine", harmonicity: 0.5 },
      envelope: { attack: 0.005, decay: 0.9, sustain: 0.08, release: 0.9 },
    },
    cutoff: 3200,
    volume: -12,
  },
  bass: {
    options: {
      oscillator: { type: "fmsquare", modulationType: "sine", harmonicity: 0.4 },
      envelope: { attack: 0.01, decay: 0.7, sustain: 0.15, release: 0.6 },
    },
    cutoff: 900,
    volume: -8,
  },
  ukulele: {
    options: {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.004, decay: 0.5, sustain: 0.03, release: 0.5 },
    },
    cutoff: 4500,
    volume: -13,
  },
  electricPiano: {
    options: {
      oscillator: { type: "fmsine", modulationType: "sine", harmonicity: 3.01 },
      envelope: { attack: 0.006, decay: 1.6, sustain: 0.12, release: 1.4 },
    },
    cutoff: 5000,
    volume: -11,
  },
  fm: {
    options: {
      oscillator: { type: "fmsine", modulationType: "square", harmonicity: 1.5 },
      envelope: { attack: 0.02, decay: 0.6, sustain: 0.3, release: 1.2 },
    },
    cutoff: 6000,
    volume: -14,
  },
  pad: {
    options: {
      oscillator: { type: "fatsawtooth", count: 3, spread: 30 },
      envelope: { attack: 0.6, decay: 1.4, sustain: 0.6, release: 2.4 },
    },
    cutoff: 2400,
    volume: -18,
  },
};

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
  const synth = new tone.PolySynth(tone.Synth, preset.options as never);
  synth.volume.value = preset.volume;

  synth.connect(filter);
  if (destination) {
    filter.connect(destination);
  } else {
    filter.toDestination();
  }

  return {
    synth,
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
