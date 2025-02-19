import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";

export default function TabForm({
  tab,
  updateTabData,
  position,
  getEmptyTab,
  addNewTab,
  deleteTab,
}) {
  // CONSTANTS
  const strings = [1, 2, 3, 4, 5, 6]; // eventually this will be customizable
  const frets = [
    -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
    19, 20, 21, 22, 23, 24,
  ];

  // STATES
  const [formData, setFormData] = useState(tab[position].notes);

  // HOOKS
  const currentNotes = useMemo(() => tab[position]?.notes, [tab, position]);

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

  function saveFormData(Event) {
    // prevent page reload from pressing save
    Event.preventDefault();
    // updates tab with formData
    updateTabData(position, formData);
  }

  // maps over each string; for each string
  //    map over frets and create a radio button/field + label
  const allFields = (
    <>
      {strings.map((string) => (
        <fieldset key={string} className="form-string">
          <span className="legend">
            <legend>{`String ${string}`}</legend>
          </span>
          <div className="form-string-fret">
            {frets.map((fret) => (
              <label key={fret} className="form-fret">
                {string === 1 ? fret : null}

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
      ))}
    </>
  );

  return (
    <section className="tab-form-section">
      <form onSubmit={saveFormData}>
        {allFields}
        <button>Save</button>
      </form>
      <div className="form-button-group">
        <button onClick={() => setFormData(getEmptyTab().notes)}>Clear</button>
        <button onClick={() => addNewTab(position, false)}>Duplicate</button>
        <button
          onClick={() => deleteTab(tab[position].id)}
          disabled={tab.length === 1}>
          Delete
        </button>
      </div>
    </section>
  );
}

TabForm.propTypes = {
  tab: PropTypes.array.isRequired,
  updateTabData: PropTypes.func.isRequired,
  position: PropTypes.number.isRequired,
  getEmptyTab: PropTypes.func.isRequired,
  addNewTab: PropTypes.func.isRequired,
  deleteTab: PropTypes.func.isRequired,
};
