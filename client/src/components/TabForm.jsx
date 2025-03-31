import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";

export default function TabForm({
  tab,
  updateTabData,
  measure,
  frame,
  getEmptyFrame,
}) {
  // CONSTANTS
  const strings = [1, 2, 3, 4, 5, 6]; // eventually this will be customizable
  const frets = [
    -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
    19, 20, 21, 22, 23, 24,
  ];

  const currentNotes = useMemo(
    () => tab[measure][frame]?.notes,
    [tab, measure, frame]
  );

  // STATES
  const [formData, setFormData] = useState(currentNotes);

  // HOOKS

  useEffect(() => {
    // Whenever user's current position changes, update formData to current position
    setFormData(currentNotes);
  }, [currentNotes]);

  // FUNCTIONS
  function updateFret(Event, string) {
    const { value } = Event.target;
    setFormData((prev) =>
      prev.map((item, index) =>
        index === string - 1 ? { ...item, fret: parseInt(value) } : item
      )
    );
  }

  function updateStyle(Event, string) {
    const { value } = Event.target;
    setFormData((prev) =>
      prev.map((item, index) =>
        index === string - 1 ? { ...item, style: value } : item
      )
    );
  }

  function clearHandler(Event) {
    Event.preventDefault();
    setFormData(getEmptyFrame().notes);
  }

  function saveFormData(Event) {
    // prevent page reload from pressing save
    Event.preventDefault();
    // updates tab with formData
    updateTabData(measure, frame, formData);
  }

  const buttonStyle =
    "px-2 py-2 border border-neutral-600 rounded font-semibold";
  const saveButtonStyle = `bg-neutral-100 text-neutral-800 ${buttonStyle} hover:bg-neutral-300`;

  const allFields = (
    <>
      <hr className="text-neutral-700 " />

      <div className="flex flex-col sm:flex-row text-sm my-4 w-full border border-neutral-700 rounded-sm sm:divide-x">
        {strings.toReversed().map((string) => (
          <fieldset
            className="grid grid-cols-3 sm:flex sm:flex-col gap-2 w-full p-2 border-b sm:border-b-0 border-neutral-700"
            name={`String ${string}`}
            key={`String ${string}`}>
            <legend className="hidden">{`String ${string}`}</legend>
            <label
              htmlFor={`String ${string}`}
              className="font-medium text-neutral-50">
              {`String ${string}`}
            </label>
            <label className="tf-fretboard tf-component">
              <span className={string > 1 ? "visually-hidden" : ""}>
                <span className="hidden">Select a Fret</span>
              </span>
              <select
                className="bg-neutral-700 p-1 rounded w-full"
                value={formData[string - 1].fret}
                onChange={(Event) => updateFret(Event, string)}>
                {frets.map((fret) => (
                  <option key={fret} value={fret}>
                    {fret === -2 ? "" : fret === -1 ? "X" : fret}
                  </option>
                ))}
              </select>
            </label>

            <label className="tf-style tf-component">
              <span className={string > 1 ? "hidden" : ""}>
                <span className="hidden">Select a Style</span>
              </span>
              <select
                disabled={formData[string - 1].fret < 0}
                className="tf-style-selector bg-neutral-700 p-1 rounded w-full disabled:invisible"
                value={formData[string - 1].style}
                onChange={(Event) => updateStyle(Event, string)}>
                <option
                  value="none"
                  className="tf-style-option"
                  defaultChecked={true}>
                  None
                </option>
                <option value="bend" className="tf-style-option">
                  Bend
                </option>
                <option value="slide" className="tf-style-option">
                  Slide
                </option>
                <option value="hammerOn" className="tf-style-option">
                  Hammer On
                </option>
                <option value="pullOff" className="tf-style-option">
                  Pull Off
                </option>
                <option value="harmonic" className="tf-style-option">
                  Harmonic
                </option>
                <option value="tap" className="tf-style-option">
                  Tap
                </option>
              </select>
            </label>
          </fieldset>
        ))}
      </div>
    </>
  );

  return (
    <div className="tf-form">
      <form className="my-4" onSubmit={saveFormData}>
        {allFields}
        <div className="grid grid-cols-2 gap-2">
          <button className={saveButtonStyle}>Save</button>
          <button
            className={`${buttonStyle} hover:bg-neutral-700`}
            onClick={clearHandler}>
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}

TabForm.propTypes = {
  tab: PropTypes.array.isRequired,
  updateTabData: PropTypes.func.isRequired,
  measure: PropTypes.number.isRequired,
  frame: PropTypes.number.isRequired,
  getEmptyFrame: PropTypes.func.isRequired,
};
