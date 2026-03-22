import { Fragment } from "react";
import { useTabEditor } from "../context/tabEditorProvider";
import type { TabSelectionType } from "../shared/types/utilities.types";

function isInSelection(
  measureIndex: number,
  frameIndex: number,
  selection: TabSelectionType
): boolean {
  if (!selection) return false;
  const { anchor, head } = selection;
  const flatten = (m: number, f: number) => m * 10000 + f;
  const pos = flatten(measureIndex, frameIndex);
  const start = Math.min(flatten(anchor.measure, anchor.frame), flatten(head.measure, head.frame));
  const end = Math.max(flatten(anchor.measure, anchor.frame), flatten(head.measure, head.frame));
  return pos >= start && pos <= end;
}

export default function TabDisplay() {
  const { tab, position, selection, updatePosition, addFrameAndAdvance, addNewMeasure } =
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

  const isCurrentFrame = (measureIndex: number, frameIndex: number) =>
    position.measure === measureIndex && position.frame === frameIndex;

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
                aria-label={`Measure ${tabChunk.measureIndex + 1} Frame ${tabChunk.frameIndex + 1
                  }`}
                className={`flex flex-col gap-4 justify-center w-full border border-transparent hover:border-neutral-300 rounded ${isCurrentFrame(tabChunk.measureIndex, tabChunk.frameIndex)
                  ? "rounded-sm bg-neutral-300/20"
                  : ""
                  } ${isInSelection(tabChunk.measureIndex, tabChunk.frameIndex, selection)
                    ? "bg-blue-500/20"
                    : ""
                  }`}
                onClick={() =>
                  updatePosition(tabChunk.measureIndex, tabChunk.frameIndex)
                }>
                {tabChunk.frame.notes.map((note, noteIndex) => (
                  <p
                    className={`td-grid-note z-2 dark:text-neutral-200 ${isCurrentFrame(tabChunk.measureIndex, tabChunk.frameIndex) &&
                      position.string === noteIndex
                      ? "bg-indigo-400/30 rounded-sm"
                      : ""
                      }`}
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
