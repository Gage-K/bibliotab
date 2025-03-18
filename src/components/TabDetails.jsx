import { useState, useContext } from "react";

import { TabContext } from "./MainTabEditor";

import PropTypes from "prop-types";

import {} from "@phosphor-icons/react";
import { TablabContext } from "../layouts/TablabContextLayout";

export default function TabDetails() {
  const notes = [
    "Ab",
    "A",
    "A#",
    "Bb",
    "B",
    "C",
    "C#",
    "Db",
    "D",
    "D#",
    "Eb",
    "E",
    "F",
    "F#",
    "Gb",
    "G",
    "G#",
  ];
  const strings = [1, 2, 3, 4, 5, 6];

  const [isShown, setIsShown] = useState(false);

  const { id } = useContext(TabContext);
  const { tabs, updateDetails } = useContext(TablabContext);

  const currentTab = tabs.find((tab) => tab.id === id);

  function handleTuning(event, string, value) {
    const newTuning = currentTab.details.tuning.map((note, index) =>
      index === string ? value : note
    );
    updateDetails(id, event.target.name, newTuning);
  }

  return (
    <section className="tab-details tab-header mb-8">
      <div className="tab-details-container text-neutral-800 group">
        <div className="tab-details-top-wrapper flex gap-2 group">
          <h1 className="text-5xl font-bold mb-4 mt-8">
            {currentTab.details.song}
          </h1>
        </div>

        <div className="tab-details-sub-container flex flex-wrap gap-2 items-baseline text-neutral-500 font-medium">
          <p className="">
            By {currentTab.details.artist}, tuning:{" "}
            {currentTab.details.tuning.toReversed().join("")}
          </p>

          <button
            className="text-xs text-neutral-400 hover:text-neutral-800 hover:underline"
            onClick={() => setIsShown((prev) => !prev)}>
            {isShown ? "(close)" : "(edit)"}
          </button>
        </div>
      </div>
      {isShown ? (
        <form className="py-4 flex flex-col gap-2 max-w-2xl">
          <label htmlFor="song" className="font-semibold text-neutral-800">
            Song
          </label>
          <input
            name="song"
            type="text"
            value={currentTab.details.song}
            onChange={(event) =>
              updateDetails(id, event.target.name, event.target.value)
            }
            className="px-2 py-1 mb-2 border border-neutral-400 rounded-sm text-neutral-600 focus-within:text-neutral-800"
          />

          <label htmlFor="artist" className="font-semibold text-neutral-800">
            Artist
          </label>
          <input
            name="artist"
            type="text"
            value={currentTab.details.artist}
            onChange={(event) =>
              updateDetails(id, event.target.name, event.target.value)
            }
            className="px-2 py-1 mb-2 border border-neutral-400 rounded-sm text-neutral-600 focus-within:text-neutral-800"></input>
          <label htmlFor="legend" className="font-semibold text-neutral-800">
            Tuning
          </label>
          <fieldset className="border border-neutral-300 rounded-sm">
            <legend
              name="legend"
              className="hidden font-semibold text-neutral-800">
              Tuning
            </legend>
            <div className="grid grid-cols-6 text-sm">
              {strings.toReversed().map((string) => (
                <div
                  key={string}
                  className="px-2 py-2 border-r last:border-none border-neutral-300 flex flex-col gap-1">
                  <label
                    htmlFor="tuning"
                    className="font-medium text-neutral-800">
                    {`String ${string}`}
                  </label>
                  <select
                    name="tuning"
                    value={currentTab.details.tuning[string - 1]}
                    onChange={(event) =>
                      handleTuning(event, string - 1, event.target.value)
                    }
                    className="bg-neutral-100 p-1 rounded">
                    {notes.map((note) => (
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
