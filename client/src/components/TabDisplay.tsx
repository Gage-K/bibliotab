import { Fragment } from "react";
import { TrashIcon } from "@phosphor-icons/react";
import { useTabEditor } from "../context/tabEditorProvider";
import { frameOrdinal, sectionMeasureOffset } from "../utils/tabOperations";
import type { TabBodyType } from "../shared/types/tab.types";
import type { TabSelectionType } from "../shared/types/utilities.types";

type FramePosition = { section: number; measure: number; frame: number };

/**
 * Selection bounds as document-order frame ordinals, so a range that starts in one
 * section and ends in another still highlights everything between.
 */
function selectionBounds(
  tab: TabBodyType,
  selection: TabSelectionType
): { start: number; end: number } | null {
  if (!selection) return null;
  const anchor = frameOrdinal(tab, selection.anchor);
  const head = frameOrdinal(tab, selection.head);
  return { start: Math.min(anchor, head), end: Math.max(anchor, head) };
}

function isInSelection(
  ordinal: number,
  bounds: { start: number; end: number } | null
): boolean {
  if (!bounds) return false;
  return ordinal >= bounds.start && ordinal <= bounds.end;
}

function selectionRounding(
  ordinal: number,
  bounds: { start: number; end: number } | null
): string {
  if (!bounds) return "rounded";
  if (ordinal < bounds.start || ordinal > bounds.end) return "rounded";
  const isStart = ordinal === bounds.start;
  const isEnd = ordinal === bounds.end;
  if (isStart && isEnd) return "rounded-sm";
  if (isStart) return "rounded-l-sm rounded-r-none";
  if (isEnd) return "rounded-r-sm rounded-l-none";
  return "rounded-none";
}

export default function TabDisplay() {
  const {
    tab,
    position,
    selection,
    updatePosition,
    addFrameAndAdvance,
    addNewMeasure,
    renameSection,
    deleteSection,
  } = useTabEditor();

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
                ? `/ ${newNote}`
                : style === "harmonic"
                  ? `<${newNote}>`
                  : style === "tap"
                    ? `${newNote}t`
                    : newNote;

    return interpretedNote;
  }

  const bounds = selectionBounds(tab, selection);

  // Frames before each section, so a frame's document-order ordinal is just
  // sectionFrameOffsets[section] + its index within the section.
  const sectionFrameOffsets: number[] = [];
  let framesSoFar = 0;
  for (const section of tab.sections) {
    sectionFrameOffsets.push(framesSoFar);
    framesSoFar += section.measures.reduce((sum, measure) => sum + measure.length, 0);
  }

  const isCurrentFrame = (pos: FramePosition) =>
    position.section === pos.section &&
    position.measure === pos.measure &&
    position.frame === pos.frame;

  return (
    <>
      {tab.sections.map((section, sectionIndex) => {
        // Measures are numbered continuously across the whole tab.
        const measureOffset = sectionMeasureOffset(tab, sectionIndex);
        const measureRange =
          section.measures.length === 1
            ? `Measure ${measureOffset + 1}`
            : `Measures ${measureOffset + 1}–${measureOffset + section.measures.length}`;

        const flattenedSection = section.measures.flatMap((measure, measureIndex) =>
          measure.map((frame, frameIndex) => ({ frame, measureIndex, frameIndex }))
        );

        return (
          <section key={section.id} className="mt-8 first:mt-0">
            <header className="flex items-center gap-2 border-b border-border pb-1">
              <input
                aria-label={`Section ${sectionIndex + 1} name`}
                value={section.name}
                onChange={(event) => renameSection(sectionIndex, event.target.value)}
                className={`min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none rounded px-1 py-0.5 hover:bg-foreground/5 focus:bg-foreground/5 ${
                  position.section === sectionIndex ? "text-foreground" : "text-muted-foreground"
                }`}
              />
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {measureRange}
              </span>
              <button
                aria-label={`Delete section ${section.name}`}
                title={
                  tab.sections.length === 1
                    ? "A tab must keep at least one section"
                    : `Delete ${section.name}`
                }
                disabled={tab.sections.length === 1}
                onClick={() => deleteSection(sectionIndex)}
                className="shrink-0 p-1 rounded hover:bg-foreground/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                <TrashIcon size={14} />
              </button>
            </header>

            <div className="td-grid">
              {flattenedSection.map((tabChunk, tabChunkIndex) => {
                const framePosition: FramePosition = {
                  section: sectionIndex,
                  measure: tabChunk.measureIndex,
                  frame: tabChunk.frameIndex,
                };
                const ordinal = sectionFrameOffsets[sectionIndex] + tabChunkIndex;
                const isLastInSection = tabChunkIndex === flattenedSection.length - 1;

                return (
                  <Fragment key={`${tabChunk.measureIndex}-${tabChunk.frameIndex}`}>
                    {tabChunkIndex === 0 && (
                      <button
                        className="td-grid-button-measure hidden"
                        onClick={() => addNewMeasure(sectionIndex, -1)}>
                        Insert Measure
                      </button>
                    )}
                    <div
                      className={
                        isLastInSection
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
                          onClick={() =>
                            addFrameAndAdvance(sectionIndex, tabChunk.measureIndex, -1, true)
                          }>
                          +
                        </button>
                      )}
                      <button
                        aria-label={`Section ${sectionIndex + 1} Measure ${
                          tabChunk.measureIndex + 1
                        } Frame ${tabChunk.frameIndex + 1}`}
                        className={`flex flex-col gap-4 justify-center w-full border border-transparent hover:border-border ${selectionRounding(ordinal, bounds)} ${
                          isCurrentFrame(framePosition) ? "bg-accent" : ""
                        } ${isInSelection(ordinal, bounds) ? "bg-primary/20" : ""}`}
                        onClick={() =>
                          updatePosition(
                            sectionIndex,
                            tabChunk.measureIndex,
                            tabChunk.frameIndex
                          )
                        }>
                        {tabChunk.frame.notes.map((note, noteIndex) => (
                          <p
                            className={`td-grid-note z-2 text-foreground ${
                              isCurrentFrame(framePosition) && position.string === noteIndex
                                ? "bg-primary/20 rounded-sm"
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
                          addFrameAndAdvance(
                            sectionIndex,
                            tabChunk.measureIndex,
                            tabChunk.frameIndex,
                            true
                          )
                        }>
                        +
                      </button>
                    </div>

                    {isLastInSection && (
                      <button
                        className="td-grid-button-measure hidden"
                        onClick={() => addNewMeasure(sectionIndex, section.measures.length)}>
                        Insert measure
                      </button>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}
