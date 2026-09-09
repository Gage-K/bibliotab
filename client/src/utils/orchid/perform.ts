import type * as Tone from "tone";
import type { ToneModule } from "../toneLoader";

export type PerformanceModeId =
  | "block"
  | "strum"
  | "slop"
  | "arp"
  | "pattern"
  | "harp";

export const PERFORMANCE_MODES: { id: PerformanceModeId; label: string; hint: string }[] =
  [
    { id: "block", label: "Block", hint: "All notes together" },
    { id: "strum", label: "Strum", hint: "Staggered low to high" },
    { id: "slop", label: "Slop", hint: "Strum with human timing" },
    { id: "arp", label: "Arp", hint: "Cycles the chord tones" },
    { id: "pattern", label: "Pattern", hint: "Repeating rhythmic figure" },
    { id: "harp", label: "Harp", hint: "Fast gliss, long release" },
  ];

export type PerformOptions = {
  /** The loaded tone module. Passed in so this file stays out of the initial bundle. */
  tone: ToneModule;
  synth: Tone.PolySynth;
  notes: string[];
  /** Beats per minute, for the modes that repeat. */
  bpm: number;
  /** 0-1, how wide the strum/arp spacing is. */
  intensity: number;
};

/** Handle for a mode that keeps playing until released (arp, pattern). */
export type PerformanceHandle = { stop: () => void };

const NOOP_HANDLE: PerformanceHandle = { stop: () => {} };

/**
 * Plays a voiced chord in the chosen style.
 *
 * One-shot modes (block, strum, slop, harp) fire immediately and return nothing to
 * clean up. Repeating modes (arp, pattern) return a handle whose `stop` cancels the
 * loop — the caller must call it when the chord changes, or loops accumulate.
 */
export function performChord(
  mode: PerformanceModeId,
  { tone, synth, notes, bpm, intensity }: PerformOptions,
): PerformanceHandle {
  if (notes.length === 0) return NOOP_HANDLE;

  const now = tone.now();
  const beat = 60 / bpm;

  switch (mode) {
    case "block":
      synth.triggerAttackRelease(notes, beat * 2, now);
      return NOOP_HANDLE;

    case "strum": {
      const offset = 0.012 + intensity * 0.05;
      notes.forEach((note, i) => {
        synth.triggerAttackRelease(note, beat * 2, now + i * offset);
      });
      return NOOP_HANDLE;
    }

    case "slop": {
      // Humanising is timing jitter plus velocity jitter; without the velocity part it
      // reads as sloppy rather than played.
      const offset = 0.02 + intensity * 0.06;
      notes.forEach((note, i) => {
        const jitter = (Math.random() - 0.5) * 0.03;
        const velocity = 0.6 + Math.random() * 0.4;
        synth.triggerAttackRelease(
          note,
          beat * 2,
          now + i * offset + jitter,
          velocity,
        );
      });
      return NOOP_HANDLE;
    }

    case "harp": {
      // Very tight spacing with a long tail, so the notes overlap into one wash.
      const offset = 0.02 + intensity * 0.02;
      notes.forEach((note, i) => {
        synth.triggerAttackRelease(note, beat * 4, now + i * offset);
      });
      return NOOP_HANDLE;
    }

    case "arp": {
      const step = beat / (intensity > 0.5 ? 4 : 2);
      let index = 0;
      const loop = new tone.Loop((time) => {
        const note = notes[index % notes.length];
        synth.triggerAttackRelease(note, step * 0.9, time);
        index++;
      }, step).start(0);

      tone.getTransport().start();
      return {
        stop: () => {
          loop.stop();
          loop.dispose();
        },
      };
    }

    case "pattern": {
      // A fixed figure over the chord tones — root, top, middle, top — which is enough
      // shape to sound deliberate without needing a pattern editor.
      const figure = [0, notes.length - 1, Math.floor(notes.length / 2), notes.length - 1];
      const step = beat / 2;
      let index = 0;
      const loop = new tone.Loop((time) => {
        const note = notes[figure[index % figure.length]];
        synth.triggerAttackRelease(note, step * 0.8, time);
        index++;
      }, step).start(0);

      tone.getTransport().start();
      return {
        stop: () => {
          loop.stop();
          loop.dispose();
        },
      };
    }

    default:
      return NOOP_HANDLE;
  }
}
