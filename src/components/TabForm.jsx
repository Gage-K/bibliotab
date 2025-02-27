import { useState, useEffect, useContext, useMemo } from "react";
import PropTypes from "prop-types";
import { TabContext } from "./MainTabEditor";
import { TablabContext } from "../layouts/TablabContextLayout";

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

  const { id } = useContext(TabContext);
  const { tabs } = useContext(TablabContext);
  const currentTab = tabs.find((tab) => tab.id === id);

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

  const allFields = (
    <>
      {strings.map((string) => (
        <fieldset className="tf-string" key={`String ${string}`}>
          <legend className="visually-hidden">{`String ${string}`}</legend>
          <span className="tf-string-legend tf-component">
            <span className={string > 1 ? "visually-hidden" : ""}>String </span>
            <span>{string}</span>
          </span>

          {/*<fieldset className="tf-fretboard">
            <legend className="tf-fretboard-legend">
              <span className="visually-hidden">Select a fret</span>
            </legend>
            {frets.map((fret) => (
              <>
                <label key={fret} className="tf-fret">
                  <span
                    className={
                      string > 1
                        ? "visually-hidden tf-fret-label"
                        : "tf-fret-label"
                    }>
                    {fret === -2 ? "Ø" : fret === -1 ? "X" : fret}
                  </span>

                  <input
                    className="tf-fret-input"
                    onChange={(Event) => updateFret(Event, string)}
                    type="radio"
                    name={`string${string}`}
                    value={fret}
                    checked={formData[string - 1].fret === fret}
                  />
                </label>
              </>
            ))}
          </fieldset>*/}

          <label className="tf-fretboard tf-component">
            <span className={string > 1 ? "visually-hidden" : ""}>
              <span className="visually-hidden">Select a </span>Fret
            </span>
            <select
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
            <span className={string > 1 ? "visually-hidden" : ""}>
              <span className="visually-hidden">Select a </span>Style
            </span>
            <select
              disabled={formData[string - 1].fret < 0}
              className="tf-style-selector"
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
    </>
  );

  // maps over each string; for each string
  //    map over frets and create a radio button/field + label
  /* const allFields = (
    <>
      {strings.map((string) => (
        <>
          <fieldset key={string} className="form-string">
            <legend className="legend">{`String ${string}`}</legend>
            <div className="form-string-fret">
              {frets.map((fret) => (
                <label key={fret} className="form-fret">
                  {string === 1
                    ? fret === -2
                      ? "Ø"
                      : fret === -1
                      ? "X"
                      : fret
                    : null}

                  <input
                    onChange={(Event) => updateFret(Event, string)}
                    type="radio"
                    name={`string${string}`}
                    value={fret}
                    checked={formData[string - 1].fret === fret}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <label className="style">
            Style
            <select>
              <option value="none" defaultChecked={true}>
                None
              </option>
              <option value="bend">Bend</option>
              <option value="slide">Slide</option>
              <option value="hammerOn">Hammer On</option>
              <option value="pullOff">Pull Off</option>
              <option value="harmonic">Harmonic</option>
              <option value="tap">Tap</option>
            </select>
          </label>
        </>
      ))}
    </>
  ); */

  return (
    <div className="tf-form">
      <form onSubmit={saveFormData}>
        {allFields}
        <div className="tf-form-buttons">
          <button>Save</button>
          <button onClick={clearHandler}>Clear</button>
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
