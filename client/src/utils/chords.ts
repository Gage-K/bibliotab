import chordsData from "../data/chords.json";
import { derivePitchClass, deriveBassPitchClass } from "./pitch";
import type { NoteFretType, TuningNoteType } from "@/shared/types/tab.types";

// ROOT key as spelled in chords.json ("Csharp"/"Fsharp", not "C#") -> pitch class.
const ROOT_PC: Record<string, number> = {
  C: 0,
  Csharp: 1,
  D: 2,
  Eb: 3,
  E: 4,
  F: 5,
  Fsharp: 6,
  G: 7,
  Ab: 8,
  A: 9,
  Bb: 10,
  B: 11,
};

function prettify(key: string, suffix: string): string {
  const root = key.replace("sharp", "#"); // "Csharp" -> "C#"
  const suf = suffix === "major" ? "" : suffix === "minor" ? "m" : suffix;
  return `${root}${suf}`;
}

function setKey(bassPc: number, pcs: number[]): string {
  return `${bassPc}|${[...new Set(pcs)].sort((a, b) => a - b).join(",")}`;
}

type ChordEntry = {
  key: string;
  suffix: string;
  positions: { midi?: number[] }[];
};

const CHORD_INDEX = new Map<string, { rootPc: number; name: string }[]>();

for (const [rootKey, entries] of Object.entries(chordsData.chords)) {
  const rootPc = ROOT_PC[rootKey];
  if (rootPc === undefined) continue;
  for (const entry of entries as ChordEntry[]) {
    const name = prettify(entry.key, entry.suffix);
    for (const pos of entry.positions) {
      const midi = pos.midi;
      if (!Array.isArray(midi) || midi.length === 0) continue;
      const bassPc = Math.min(...midi) % 12;
      const pcs = midi.map((m) => m % 12);
      const k = setKey(bassPc, pcs);
      const list = CHORD_INDEX.get(k) ?? [];
      list.push({ rootPc, name });
      CHORD_INDEX.set(k, list);
    }
  }
}

export function chordNameFromPitchClasses(
  pcs: number[],
  bassPc: number,
): string | null {
  const cands = CHORD_INDEX.get(setKey(bassPc, pcs));
  if (!cands || cands.length === 0) return null;
  const rootPosition = cands.find((c) => c.rootPc === bassPc);
  return (rootPosition ?? cands[0]).name;
}

export function chordNameForFrame(
  notes: NoteFretType[],
  tuning: TuningNoteType[],
): string | null {
  const pcs = derivePitchClass(notes, tuning);
  if (pcs.length < 2) return null; // a single note isn't a chord
  const bassPc = deriveBassPitchClass(notes, tuning);
  if (bassPc === null) return null;
  return chordNameFromPitchClasses(pcs, bassPc);
}
