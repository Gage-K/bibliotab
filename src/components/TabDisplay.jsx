import PropTypes from "prop-types";
import { nanoid } from "nanoid";
import { Fragment } from "react";
import { TabContext } from "./MainTabEditor";
import { useContext } from "react";

export default function TabDisplay({
  tab,
  position,
  updatePosition,
  addNewFrame,
  addNewMeasure,
  tuning,
}) {
  const { details } = useContext(TabContext);

  const renderTuning = (
    <div className="td-grid-tuning">
      {tuning.map((note, index) => (
        <p className="" key={index}>
          {note}
        </p>
      ))}
    </div>
  );

  function interpretNote(note, style) {
    const newNote = note === -2 ? "\u00A0\u00A0" : note === -1 ? "X" : note;
    const interpretedNote =
      style === "none"
        ? newNote
        : style === "hammerOn"
        ? `h${newNote}`
        : style === "bend"
        ? `${newNote}b`
        : style === "pullOff"
        ? `p${newNote}`
        : style === "slide"
        ? `${newNote}/`
        : style === "slide"
        ? `${newNote}/`
        : style === "harmonic"
        ? `<${newNote}>`
        : style === "tap"
        ? `${newNote}t`
        : newNote;

    return interpretedNote;
  }

  // removes tab nesting and creates one continuous tab array
  const flattenedTab = tab.flatMap((measure, measureIndex) =>
    measure.map((frame, frameIndex) => ({
      frame,
      measureIndex,
      frameIndex,
    }))
  );

  return (
    <>
      <section className="td-grid">
        {renderTuning}
        {flattenedTab.map((tabChunk, tabChunkIndex) => (
          <Fragment key={nanoid()}>
            {tabChunkIndex === 0 && (
              <button
                className="td-grid-button-measure"
                onClick={() => addNewMeasure(-1)}>
                Insert Measure
              </button>
            )}
            <div
              className={
                tabChunkIndex === flattenedTab.length - 1
                  ? tabChunk.frameIndex === 0
                    ? "td-grid-frame-wrapper td-measure-start td-measure-end"
                    : "td-grid-frame-wrapper td-measure-end"
                  : tabChunk.frameIndex === 0
                  ? "td-grid-frame-wrapper td-measure-start"
                  : "td-grid-frame-wrapper"
              }>
              {tabChunk.frameIndex === 0 && (
                <button
                  className="td-grid-button"
                  onClick={() => addNewFrame(tabChunk.measureIndex, -1, true)}>
                  +
                </button>
              )}
              <div
                key={nanoid()}
                className={
                  position.measure === tabChunk.measureIndex &&
                  position.frame === tabChunk.frameIndex
                    ? "td-grid-frame td-current-pos"
                    : "td-grid-frame"
                }
                onClick={() =>
                  updatePosition(tabChunk.measureIndex, tabChunk.frameIndex)
                }>
                {tabChunk.frame.notes.map((note, noteIndex) => (
                  <p className="td-grid-note" key={noteIndex}>
                    {interpretNote(note.fret, note.style)}
                  </p>
                ))}
              </div>
              <button
                className="td-grid-button"
                onClick={() =>
                  addNewFrame(tabChunk.measureIndex, tabChunk.frameIndex, true)
                }>
                +
              </button>
            </div>

            {tabChunkIndex === flattenedTab.length - 1 && (
              <>
                <button
                  className="td-grid-button-measure"
                  onClick={() => addNewMeasure(tab.length)}>
                  Insert measure
                </button>
              </>
            )}
          </Fragment>
        ))}
      </section>
    </>
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
