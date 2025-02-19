import PropTypes from "prop-types";
import { nanoid } from "nanoid";

export default function TabDisplay({
  tab,
  position,
  tuning,
  updatePosition,
  addNewFrame,
  addNewMeasure,
}) {
  const renderTuning = (
    <div className="tab-frame">
      {tuning.toReversed().map((note) => (
        <p key={nanoid()}>{note}</p>
      ))}
    </div>
  );
  return (
    // maps over all of the tab and for each frane of tab:
    //      add an onClick that updates position
    //      if position = index of frame, add current class
    //      map over the array of notes in that frame
    //          display the fretted positions in notes array

    <section className="tab-display">
      <span>||</span>
      {renderTuning}
      <span>|</span>

      {tab.map((measure, measureIndex) => (
        <div key={measureIndex} className="tab-measure-container">
          <button
            className="button-plus"
            onClick={() => addNewFrame(measureIndex, -1, true)}>
            +
          </button>
          {measure.map((frame, frameIndex) => (
            <div key={frameIndex} className="tab-frame-container">
              <div
                key={frame.id}
                className={
                  position.measure === measureIndex &&
                  position.index === frameIndex
                    ? "tab-frame tab-current-pos"
                    : "tab-frame"
                }
                onClick={() => updatePosition(measureIndex, frameIndex)}>
                {frame.notes.map((note) => (
                  <p key={frame.notes.indexOf(note)}>{note.fret}</p>
                ))}
              </div>
              <button
                className="button-plus"
                onClick={() => addNewFrame(measureIndex, frameIndex, true)}>
                +
              </button>
            </div>
          ))}
          <span>|</span>
        </div>
      ))}
      <button
        className="button-plus last"
        onClick={() => addNewMeasure(tab.length)}>
        +
      </button>
    </section>
  );
}

TabDisplay.propTypes = {
  tab: PropTypes.array.isRequired,
  position: PropTypes.number.isRequired,
  tuning: PropTypes.array.isRequired,
  updatePosition: PropTypes.func.isRequired,
  addNewFrame: PropTypes.func.isRequired,
  addNewMeasure: PropTypes.func.isRequired,
};

/*
{tab.map((frame, index) => (
        <div key={nanoid()} className="tab-frame-container">
          <div
            key={frame.id}
            className={
              index === position ? "tab-current-pos tab-frame" : "tab-frame"
            }
            onClick={() => updatePosition(index)}>
            {frame.notes.map((note) => (
              <p key={frame.notes.indexOf(note)}>{note.fret}</p>
            ))}
          </div>
          <button
            className="button-plus"
            onClick={() => addNewTab(index, true)}>
            +
          </button>
        </div>
      ))}
*/
