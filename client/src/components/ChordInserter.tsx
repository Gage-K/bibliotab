import { useState } from "react";
import { useTabEditor } from "../context/tabEditorProvider";
import { PITCH_CLASS_NAMES } from "../utils/pitch";
import {
  chordName,
  EXTENSION_QUALITIES,
  QUALITY_LABELS,
  TRIAD_QUALITIES,
  type QualityId,
} from "../utils/orchid/buildChord";
import { chordToFrets } from "../utils/orchid/frets";

/**
 * Builds a chord from the Orchid's chord model and writes it into the current frame as
 * frets.
 *
 * This is the reverse of the pitch derivation, so it's the one place in the editor
 * where notes drive frets rather than the other way round. The frets are what gets
 * stored — the chord choice isn't persisted, so frets stay the single source of truth.
 */
export default function ChordInserter() {
  const { track, position, updateTabData } = useTabEditor();
  const [rootPc, setRootPc] = useState(0);
  const [qualities, setQualities] = useState<QualityId[]>(["major"]);
  const [error, setError] = useState<string | null>(null);

  function toggleQuality(quality: QualityId) {
    setError(null);
    setQualities((previous) => {
      if (TRIAD_QUALITIES.includes(quality)) {
        return [quality, ...previous.filter((q) => EXTENSION_QUALITIES.includes(q))];
      }
      return previous.includes(quality)
        ? previous.filter((q) => q !== quality)
        : [...previous, quality];
    });
  }

  function insert() {
    if (!track) return;
    const notes = chordToFrets({ rootPc, qualities }, track);
    if (!notes) {
      setError(`No playable ${chordName({ rootPc, qualities })} in this tuning.`);
      return;
    }
    setError(null);
    updateTabData(position.section, position.measure, position.frame, notes);
  }

  const chip =
    "px-2 py-1 text-xs rounded border cursor-pointer transition-colors select-none";
  const chipOn = "bg-blue text-blue-foreground border-blue";
  const chipOff = "border-border hover:bg-foreground/10";

  return (
    <div className="flex flex-col gap-2 mb-3 px-1">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground shrink-0">
          Insert chord
        </span>
        <select
          aria-label="Chord root"
          value={rootPc}
          onChange={(event) => setRootPc(Number(event.target.value))}
          className="px-2 py-1 text-xs border border-border rounded bg-muted text-muted-foreground">
          {PITCH_CLASS_NAMES.map((name, pitchClass) => (
            <option key={name} value={pitchClass}>
              {name}
            </option>
          ))}
        </select>
        <button
          onClick={insert}
          disabled={!track}
          className="px-2 py-1 text-xs rounded border border-border hover:bg-foreground/10 cursor-pointer disabled:opacity-40">
          {`Insert ${chordName({ rootPc, qualities })}`}
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {[...TRIAD_QUALITIES, ...EXTENSION_QUALITIES].map((quality) => (
          <button
            key={quality}
            onClick={() => toggleQuality(quality)}
            className={`${chip} ${qualities.includes(quality) ? chipOn : chipOff}`}>
            {QUALITY_LABELS[quality]}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-muted-foreground">{error}</p>}
    </div>
  );
}
