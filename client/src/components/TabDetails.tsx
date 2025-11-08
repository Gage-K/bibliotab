import { useState } from "react";
import { TuningNoteType, TabDetailsType, TuningType } from "../types/tab.types";
import { TUNING_NOTES } from "../types/consts";

const STRINGS = [1, 2, 3, 4, 5, 6];

interface TabDetailsProps {
  details: TabDetailsType;
  updateDetails: (name: string, value: string | TuningType) => void;
}

export default function TabDetails({
  details,
  updateDetails,
}: TabDetailsProps) {
  const [isShown, setIsShown] = useState(false);

  function handleTuning(
    event: React.ChangeEvent<HTMLSelectElement>,
    string: number,
    value: TuningNoteType
  ) {
    const newTuning: TuningType = details.tuning.map(
      (note: TuningNoteType, index: number) =>
        index === string ? (value as TuningNoteType) : note
    );
    updateDetails(event.target.name, newTuning as TuningType);
  }

  return (
    <section className="tab-details tab-header mb-8">
      <div className="tab-details-container text-neutral-800 group">
        <div className="tab-details-top-wrapper flex gap-2 group">
          <h1 className="text-5xl font-bold mb-4 mt-8 dark:text-neutral-200">
            {details.song}
          </h1>
        </div>

        <div className="tab-details-sub-container flex flex-wrap gap-2 items-baseline text-neutral-500 dark:text-neutral-300 font-medium">
          <p className="">
            By {details.artist}, tuning: {details.tuning.toReversed().join("")}
          </p>

          <button
            className="text-xs text-neutral-400 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:underline"
            onClick={() => setIsShown((prev) => !prev)}>
            {isShown ? "(close)" : "(edit)"}
          </button>
        </div>
      </div>
      {isShown ? (
        <form className="py-4 flex flex-col gap-2 max-w-2xl ">
          <label
            htmlFor="song"
            className="font-semibold text-neutral-800 dark:text-neutral-300">
            Song
          </label>
          <input
            name="song"
            type="text"
            value={details.song}
            onChange={(event) =>
              updateDetails(event.target.name, event.target.value)
            }
            className="px-2 py-1 mb-2 border border-neutral-400 dark:border-neutral-600 rounded-sm text-neutral-600 dark:text-neutral-400 focus-within:text-neutral-800 dark:focus-within:text-neutral-200"
          />

          <label
            htmlFor="artist"
            className="font-semibold text-neutral-800 dark:text-neutral-300">
            Artist
          </label>
          <input
            name="artist"
            type="text"
            value={details.artist}
            onChange={(event) =>
              updateDetails(event.target.name, event.target.value)
            }
            className="px-2 py-1 mb-2 border border-neutral-400 dark:border-neutral-600 rounded-sm text-neutral-600 dark:text-neutral-400 focus-within:text-neutral-800 dark:focus-within:text-neutral-200"></input>
          <label
            htmlFor="legend"
            className="font-semibold text-neutral-800 dark:text-neutral-300">
            Tuning
          </label>
          <fieldset className="border border-neutral-300 dark:border-neutral-600 rounded-sm">
            <legend
              name="legend"
              className="sr-only font-semibold text-neutral-800 dark:text-neutral-400">
              Tuning
            </legend>
            <div className="grid grid-cols-6 text-sm">
              {STRINGS.toReversed().map((string) => (
                <div
                  key={string}
                  className="px-2 py-2 border-r last:border-none border-neutral-300 dark:border-neutral-600 flex flex-col gap-1">
                  <label
                    htmlFor="tuning"
                    className="font-medium text-neutral-800 dark:text-neutral-300">
                    {`String ${string}`}
                  </label>
                  <select
                    name="tuning"
                    value={details.tuning[string - 1]}
                    onChange={(event) =>
                      handleTuning(event, string - 1, event.target.value)
                    }
                    className="bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 p-1 rounded">
                    {NOTES.map((note) => (
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

TabDetails.propTypes = {
  details: PropTypes.object.isRequired,
  setDetials: PropTypes.func.isRequired,
};
