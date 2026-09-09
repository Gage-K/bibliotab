import { PITCH_CLASS_NAMES } from "../pitch";
import { chordIntervals, type ChordSpec } from "./buildChord";

export const MIN_BASE_OCTAVE = 1;
export const MAX_BASE_OCTAVE = 6;

/** Note name for an absolute semitone offset above C0. */
function noteAt(semitonesAboveC0: number): string {
  const pitchClass = ((semitonesAboveC0 % 12) + 12) % 12;
  const octave = Math.floor(semitonesAboveC0 / 12);
  return `${PITCH_CLASS_NAMES[pitchClass]}${octave}`;
}

export type VoicingOptions = {
  /** 0 = tight cluster, 1 = spread across roughly two octaves. */
  spread: number;
  /** How many chord tones to rotate below the root. 0 = root position. */
  inversion: number;
  baseOctave: number;
};

/**
 * Turns a chord into absolute notes.
 *
 * The dial does two things at once, which is what makes a single control feel musical:
 * `spread` pushes successive tones further apart (close voicing to open), and
 * `inversion` rotates which tone sits lowest. Neither changes the chord's identity —
 * the same pitch classes come out either way — so the player can reshape a chord while
 * it rings without it becoming a different chord.
 */
export function voiceChord(
  spec: ChordSpec,
  { spread, inversion, baseOctave }: VoicingOptions,
): string[] {
  const intervals = chordIntervals(spec.qualities);
  if (intervals.length === 0) return [];

  const rootSemitone = baseOctave * 12 + spec.rootPc;

  // Rotate the chord so `inversion` tones move up an octave: the classic inversion,
  // which lifts the lowest tones above the rest rather than reordering the array.
  const rotation = ((inversion % intervals.length) + intervals.length) % intervals.length;
  const inverted = intervals.map((interval, index) =>
    index < rotation ? interval + 12 : interval,
  );

  // Spread is applied per *position in the stack*, not per interval, so it opens the
  // voicing evenly rather than blowing the extensions out on their own.
  const ordered = [...inverted].sort((a, b) => a - b);
  const spreadSemitones = ordered.map((interval, index) => {
    const extraOctaves = Math.floor(spread * index);
    return interval + extraOctaves * 12;
  });

  return spreadSemitones
    .sort((a, b) => a - b)
    .map((interval) => noteAt(rootSemitone + interval));
}

/**
 * Bass note for a chord — the root, well below the voicing.
 *
 * A separate low voice is what stops the left hand of the chord from muddying: the
 * hardware does the same thing with a dedicated bass channel.
 */
export function bassNote(spec: ChordSpec, baseOctave: number): string {
  const octave = Math.max(0, baseOctave - 2);
  return `${PITCH_CLASS_NAMES[spec.rootPc]}${octave}`;
}
