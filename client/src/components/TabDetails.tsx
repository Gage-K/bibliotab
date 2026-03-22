import { useState } from "react";
import { TuningNoteType, TuningType } from "../shared/types/tab.types";
import { TUNING_NOTES } from "../shared/types/consts";
import { useTabEditor } from "../context/tabEditorProvider";

const STRINGS = [1, 2, 3, 4, 5, 6];

export default function TabDetails() {
  const { details, updateDetails } = useTabEditor();
  const [isShown, setIsShown] = useState(false);

  function handleTuning(
    event: React.ChangeEvent<HTMLSelectElement>,
    string: number,
    value: TuningNoteType
  ) {
    const newTuning = details.tuning.map(
      (note: TuningNoteType, index: number) =>
        index === string ? value : note
    ) as TuningType;
    updateDetails(event.target.name, newTuning);
  }

  return (
    <section className="mb-8">
      <div className="group">
        <h1 className="text-3xl font-bold text-foreground">
          {details.song}
        </h1>

        <div className="flex flex-wrap gap-2 items-baseline text-muted-foreground font-medium mt-1">
          <p>
            By {details.artist}, tuning: {details.tuning.toReversed().join("")}
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
            htmlFor="legend"
            className="font-semibold text-foreground">
            Tuning
          </label>
          <fieldset className="border border-border rounded-sm">
            <legend className="sr-only font-semibold">
              Tuning
            </legend>
            <div className="grid grid-cols-6 text-sm">
              {STRINGS.toReversed().map((string) => (
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
                    value={details.tuning[string - 1]}
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
