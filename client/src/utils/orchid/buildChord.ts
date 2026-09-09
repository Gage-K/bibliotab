import { PITCH_CLASS_NAMES } from "../pitch";

/**
 * Chord qualities as interval sets in semitones from the root.
 *
 * Held together rather than as a flat list of chord names because the Orchid's
 * interaction is *combining* modifiers — Minor + 9 is a minor ninth, not a lookup of
 * "m9". Merging interval sets makes any combination well-defined, including ones no
 * chord table would name.
 */
export const QUALITY_INTERVALS = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  dom7: [0, 10],
  maj7: [0, 11],
  sixth: [0, 9],
  ninth: [0, 14],
  eleventh: [0, 17],
  thirteenth: [0, 21],
} as const;

export type QualityId = keyof typeof QUALITY_INTERVALS;

/**
 * Qualities that define the third and fifth. Exactly one applies at a time — a chord
 * cannot be both major and diminished — so selecting one replaces the others.
 */
export const TRIAD_QUALITIES: QualityId[] = [
  "major",
  "minor",
  "dim",
  "aug",
  "sus2",
  "sus4",
];

/** Qualities that stack on top of a triad. Any number can be held at once. */
export const EXTENSION_QUALITIES: QualityId[] = [
  "dom7",
  "maj7",
  "sixth",
  "ninth",
  "eleventh",
  "thirteenth",
];

export const QUALITY_LABELS: Record<QualityId, string> = {
  major: "Maj",
  minor: "Min",
  dim: "dim",
  aug: "aug",
  sus2: "sus2",
  sus4: "sus4",
  dom7: "7",
  maj7: "maj7",
  sixth: "6",
  ninth: "9",
  eleventh: "11",
  thirteenth: "13",
};

export type ChordSpec = {
  /** Pitch class of the root, 0 = C. */
  rootPc: number;
  qualities: QualityId[];
};

/**
 * Intervals of a chord, in semitones above the root and *not* reduced to one octave.
 *
 * Keeping 9ths at 14 rather than folding them to 2 is what lets the voicer place an
 * extension above the triad instead of jammed inside it, which is most of the
 * difference between a chord that sounds intentional and one that sounds like a cluster.
 */
export function chordIntervals(qualities: QualityId[]): number[] {
  const intervals = new Set<number>([0]);

  const triad = qualities.find((q) => TRIAD_QUALITIES.includes(q)) ?? "major";
  QUALITY_INTERVALS[triad].forEach((interval) => intervals.add(interval));

  for (const quality of qualities) {
    if (TRIAD_QUALITIES.includes(quality)) continue;
    QUALITY_INTERVALS[quality].forEach((interval) => intervals.add(interval));
  }

  // A seventh replaces the sixth's role rather than sitting a semitone from it.
  if (intervals.has(10) || intervals.has(11)) intervals.delete(9);

  return [...intervals].sort((a, b) => a - b);
}

/** Pitch classes (0-11) the chord contains, deduplicated and sorted. */
export function chordPitchClasses(spec: ChordSpec): number[] {
  const pcs = new Set(
    chordIntervals(spec.qualities).map(
      (interval) => (spec.rootPc + interval) % 12,
    ),
  );
  return [...pcs].sort((a, b) => a - b);
}

/** Display name, e.g. "Cmaj7" or "Am9". Best-effort — combinations can get exotic. */
export function chordName(spec: ChordSpec): string {
  const root = PITCH_CLASS_NAMES[spec.rootPc];
  const triad = spec.qualities.find((q) => TRIAD_QUALITIES.includes(q)) ?? "major";
  const extensions = spec.qualities.filter((q) => EXTENSION_QUALITIES.includes(q));

  const triadSuffix =
    triad === "major"
      ? ""
      : triad === "minor"
        ? "m"
        : QUALITY_LABELS[triad];

  const extensionSuffix = extensions
    .map((quality) => (quality === "dom7" ? "7" : QUALITY_LABELS[quality]))
    .join("");

  return `${root}${triadSuffix}${extensionSuffix}`;
}

// ============================================================================
// Key lock
// ============================================================================

/** Semitone offsets of the major scale degrees. */
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];

/** The triad quality built on each degree of a major scale: I ii iii IV V vi vii°. */
const DIATONIC_TRIADS: QualityId[] = [
  "major",
  "minor",
  "minor",
  "major",
  "major",
  "minor",
  "dim",
];

/**
 * Snaps a pressed root to the nearest degree of `keyPc` major and gives it that
 * degree's diatonic quality.
 *
 * This is what key-lock is for: any key pressed yields something that belongs in the
 * key, so the surface is playable without knowing theory. Extensions the player is
 * holding are kept — locking the key shouldn't silently drop a 9th.
 */
export function applyKeyLock(spec: ChordSpec, keyPc: number): ChordSpec {
  const degreesFromKey = ((spec.rootPc - keyPc) % 12 + 12) % 12;

  let nearestDegree = 0;
  let smallestDistance = Infinity;
  MAJOR_SCALE.forEach((offset, degree) => {
    const distance = Math.min(
      Math.abs(offset - degreesFromKey),
      12 - Math.abs(offset - degreesFromKey),
    );
    if (distance < smallestDistance) {
      smallestDistance = distance;
      nearestDegree = degree;
    }
  });

  const extensions = spec.qualities.filter((q) => EXTENSION_QUALITIES.includes(q));

  return {
    rootPc: (keyPc + MAJOR_SCALE[nearestDegree]) % 12,
    qualities: [DIATONIC_TRIADS[nearestDegree], ...extensions],
  };
}
