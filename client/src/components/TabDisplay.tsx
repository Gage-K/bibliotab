import { Fragment } from "react";
import { useTabEditor } from "../hooks/useTabEditor";

export default function TabDisplay() {
  const { tab, position, updatePosition, addFrameAndAdvance, addNewMeasure } =
    useTabEditor();

  function interpretNote(note: number, style: string) {
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
        : style === "harmonic"
        ? `<${newNote}>`
        : style === "tap"
        ? `${newNote}t`
        : newNote;

    return interpretedNote;
  }

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
        {flattenedTab.map((tabChunk, tabChunkIndex) => (
          <Fragment key={`${tabChunk.measureIndex}-${tabChunk.frameIndex}`}>
            {tabChunkIndex === 0 && (
              <button
                className="td-grid-button-measure hidden"
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
                  className="td-grid-button hidden"
                  onClick={() => addFrameAndAdvance(tabChunk.measureIndex, -1, true)}>
                  +
                </button>
              )}
              <button
                aria-label={`Measure ${tabChunk.measureIndex + 1} Frame ${
                  tabChunk.frameIndex + 1
                }`}
                className={
                  position.measure === tabChunk.measureIndex &&
                  position.frame === tabChunk.frameIndex
                    ? "flex flex-col gap-4 justify-center w-full rounded-sm bg-neutral-300/20 border border-transparent hover:border-neutral-300 rounded"
                    : "flex flex-col gap-4 justify-center w-full border border-transparent hover:border-neutral-300 rounded"
                }
                onClick={() =>
                  updatePosition(tabChunk.measureIndex, tabChunk.frameIndex)
                }>
                {tabChunk.frame.notes.map((note, noteIndex) => (
                  <p
                    className="td-grid-note z-2 dark:text-neutral-200"
                    key={noteIndex}>
                    {interpretNote(note.fret, note.style)}
                  </p>
                ))}
              </button>
              <button
                className="td-grid-button hidden"
                onClick={() =>
                  addFrameAndAdvance(tabChunk.measureIndex, tabChunk.frameIndex, true)
                }>
                +
              </button>
            </div>

            {tabChunkIndex === flattenedTab.length - 1 && (
              <>
                <button
                  className="td-grid-button-measure hidden"
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
