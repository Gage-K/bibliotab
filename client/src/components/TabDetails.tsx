import { useMemo, useState } from "react";
import { TuningNoteType, TuningType } from "../shared/types/tab.types";
import { INSTRUMENT_PRESETS, TUNING_NOTES } from "../shared/types/consts";
import { useTabEditor } from "../context/tabEditorProvider";

export default function TabDetails() {
  const { details, track, activeTrack, stringCount, updateDetails, setTrackTuning } =
    useTabEditor();
  const [isShown, setIsShown] = useState(false);

  const tuning = track?.tuning ?? [];

  // String 1 is the highest-pitched (tuning index 0); columns render lowest-first.
  const strings = useMemo(
    () => Array.from({ length: stringCount }, (_unused, i) => i + 1),
    [stringCount]
  );

  // A preset is "current" only if the whole tuning matches, not just the instrument.
  const activePreset = INSTRUMENT_PRESETS.find(
    (preset) =>
      preset.tuning.length === tuning.length &&
      preset.tuning.every((note, i) => note === tuning[i])
  );

  function handleTuning(
    _event: React.ChangeEvent<HTMLSelectElement>,
    string: number,
    value: TuningNoteType
  ) {
    const newTuning = tuning.map((note: TuningNoteType, index: number) =>
      index === string ? value : note
    ) as TuningType;
    // Retuning one string keeps the existing octaves — the string count is unchanged.
    setTrackTuning(activeTrack, newTuning);
  }

  /**
   * Picking a preset can change the string count, which reshapes every frame in this
   * track (see resizeFrames) — added strings arrive empty, removed ones drop their
   * notes. The preset's octaves come along, since they are hand-checked.
   */
  function handlePreset(event: React.ChangeEvent<HTMLSelectElement>) {
    const preset = INSTRUMENT_PRESETS.find((p) => p.id === event.target.value);
    if (!preset) return;
    setTrackTuning(activeTrack, [...preset.tuning] as TuningType, {
      instrument: preset.instrument,
      octaves: [...preset.octaves],
    });
  }

  return (
    <section className="mb-8">
      <div className="group">
        <h1 className="text-3xl font-bold text-foreground">
          {details.song}
        </h1>

        <div className="flex flex-wrap gap-2 items-baseline text-muted-foreground font-medium mt-1">
          <p>
            By {details.artist}, tuning: {tuning.toReversed().join("")}
          </p>

          <button
            className="text-xs text-muted-foreground/60 hover:text-foreground hover:underline"
            onClick={() => setIsShown((prev) => !prev)}>
            {isShown ? "(close)" : "(edit)"}
          </button>
        </div>
      </div>
      {isShown ? (
        <form className="py-4 flex flex-col gap-2 max-w-2xl">
          <label
            htmlFor="song"
            className="font-semibold text-foreground">
            Song
          </label>
          <input
            name="song"
            type="text"
            value={details.song}
            onChange={(event) =>
              updateDetails(event.target.name, event.target.value)
            }
            className="px-2 py-1 mb-2 border border-border rounded-sm text-muted-foreground focus-within:text-foreground"
          />

          <label
            htmlFor="artist"
            className="font-semibold text-foreground">
            Artist
          </label>
          <input
            name="artist"
            type="text"
            value={details.artist}
            onChange={(event) =>
              updateDetails(event.target.name, event.target.value)
            }
            className="px-2 py-1 mb-2 border border-border rounded-sm text-muted-foreground focus-within:text-foreground"
          />
          <label
            htmlFor="instrument-preset"
            className="font-semibold text-foreground">
            Instrument
          </label>
          <select
            id="instrument-preset"
            value={activePreset?.id ?? ""}
            onChange={handlePreset}
            className="px-2 py-1 mb-2 border border-border rounded-sm bg-muted text-muted-foreground">
            {!activePreset && <option value="">Custom tuning</option>}
            {INSTRUMENT_PRESETS.map((preset) => (
              <option value={preset.id} key={preset.id}>
                {`${preset.label} (${preset.tuning.length} strings)`}
              </option>
            ))}
          </select>

          <label
            htmlFor="legend"
            className="font-semibold text-foreground">
            Tuning
          </label>
          <fieldset className="border border-border rounded-sm">
            <legend className="sr-only font-semibold">
              Tuning
            </legend>
            <div
              className="grid text-sm"
              style={{
                gridTemplateColumns: `repeat(${stringCount}, minmax(0, 1fr))`,
              }}>
              {strings.toReversed().map((string) => (
                <div
                  key={string}
                  className="px-2 py-2 border-r last:border-none border-border flex flex-col gap-1">
                  <label
                    htmlFor="tuning"
                    className="font-medium text-foreground">
                    {`String ${string}`}
                  </label>
                  <select
                    name="tuning"
                    value={tuning[string - 1]}
                    onChange={(event) =>
                      handleTuning(event, string - 1, event.target.value as TuningNoteType)
                    }
                    className="bg-muted text-muted-foreground p-1 rounded">
                    {TUNING_NOTES.map((note) => (
                      <option value={note} key={note}>
                        {note}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </fieldset>
        </form>
      ) : null}
    </section>
  );
}
