import { useState, useEffect, useMemo } from "react";
import { useTabEditor } from "../context/tabEditorProvider";
import type { NoteFretType } from "../shared/types/tab.types";

const STRINGS = [1, 2, 3, 4, 5, 6];
const FRETS = [
  -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
  19, 20, 21, 22, 23, 24,
];

export default function TabForm() {
  const { tab, position, updateTabData, getEmptyFrame } = useTabEditor();

  const currentNotes = useMemo(
    () => tab[position.measure][position.frame]?.notes,
    [tab, position.measure, position.frame]
  );

  const [formData, setFormData] = useState<NoteFretType[]>(currentNotes);

  useEffect(() => {
    setFormData(currentNotes);
  }, [currentNotes]);

  function updateFret(event: React.ChangeEvent<HTMLSelectElement>, string: number) {
    const { value } = event.target;
    setFormData((prev) =>
      prev.map((item, index) =>
        index === string - 1 ? { ...item, fret: parseInt(value) } : item
      )
    );
  }

  function updateStyle(event: React.ChangeEvent<HTMLSelectElement>, string: number) {
    const { value } = event.target;
    setFormData((prev) =>
      prev.map((item, index) =>
        index === string - 1 ? { ...item, style: value as NoteFretType["style"] } : item
      )
    );
  }

  function clearHandler(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setFormData(getEmptyFrame().notes);
  }

  function saveFormData(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateTabData(position.measure, position.frame, formData);
  }

  const buttonStyle =
    "px-2 py-2 border border-neutral-600 rounded font-semibold";
  const saveButtonStyle = `bg-neutral-100 text-neutral-800 ${buttonStyle} hover:bg-neutral-300`;

  const allFields = (
    <>
      <hr className="text-neutral-700 " />

      <div className="flex flex-col sm:flex-row text-sm my-4 w-full border border-neutral-700 rounded-sm sm:divide-x">
        {STRINGS.toReversed().map((string) => (
          <fieldset
            className="grid grid-cols-3 sm:flex sm:flex-col gap-2 w-full p-2 border-b sm:border-b-0 border-neutral-700"
            name={`String ${string}`}
            key={`String ${string}`}>
            <legend className="sr-only">{`String ${string}`}</legend>
            <label
              htmlFor={`String ${string}`}
              className="font-medium text-neutral-50">
              {`String ${string}`}
            </label>
            <label className="tf-fretboard tf-component">
              <span className={string > 1 ? "visually-hidden" : ""}>
                <span className="sr-only">Select a Fret</span>
              </span>
              <select
                className="bg-neutral-700 p-1 rounded w-full"
                value={formData[string - 1].fret}
                onChange={(event) => updateFret(event, string)}>
                {FRETS.map((fret) => (
                  <option key={fret} value={fret}>
                    {fret === -2 ? " " : fret === -1 ? "X" : fret}
                  </option>
                ))}
              </select>
            </label>

            <label className="tf-style tf-component">
              <span className={string > 1 ? "sr-only" : ""}>
                <span className="sr-only">Select a Style</span>
              </span>
              <select
                disabled={formData[string - 1].fret < 0}
                className="tf-style-selector bg-neutral-700 p-1 rounded w-full disabled:invisible"
                value={formData[string - 1].style}
                onChange={(event) => updateStyle(event, string)}>
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
