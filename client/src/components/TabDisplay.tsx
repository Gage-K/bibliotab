import { TrashIcon, PlusIcon } from "@phosphor-icons/react";
import { useTabEditor } from "../context/tabEditorProvider";
import {
  frameDuration,
  isRestFrame,
  measureBeats,
  measureIsComplete,
  measureTimeSignature,
  sectionMeasureOffset,
} from "../utils/tabOperations";
import type {
  FrameType,
  MeasureType,
  TabBodyType,
  TimeSignatureType,
} from "../shared/types/tab.types";
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
  const anchor = frameOrdinalOf(tab, selection.anchor);
  const head = frameOrdinalOf(tab, selection.head);
  return { start: Math.min(anchor, head), end: Math.max(anchor, head) };
}

/** Document-order index of a frame, counting every frame of every section before it. */
function frameOrdinalOf(
  tab: TabBodyType,
  pos: { section: number; measure: number; frame: number }
): number {
  let ordinal = 0;
  for (let s = 0; s < tab.sections.length; s++) {
    const measures = tab.sections[s].measures;
    for (let m = 0; m < measures.length; m++) {
      if (s === pos.section && m === pos.measure) return ordinal + pos.frame;
      ordinal += measures[m].frames.length;
    }
  }
  return ordinal;
}

function isInSelection(
  ordinal: number,
  bounds: { start: number; end: number } | null
): boolean {
  if (!bounds) return false;
  return ordinal >= bounds.start && ordinal <= bounds.end;
}

function fretLabel(fret: number, style: string): string {
  const value = fret === -2 ? " " : fret === -1 ? "X" : String(fret);
  switch (style) {
    case "hammerOn":
      return `h${value}`;
    case "pullOff":
      return `p${value}`;
    case "bend":
      return `${value}b`;
    case "slide":
      return `/${value}`;
    case "harmonic":
      return `<${value}>`;
    case "tap":
      return `${value}t`;
    default:
      return value;
  }
}

/** A frame's slot as a percentage of its measure — what makes a half note read wide. */
function widthPercent(frame: FrameType, totalBeats: number): number {
  if (totalBeats <= 0) return 100;
  return (frameDuration(frame) / totalBeats) * 100;
}

/**
 * The proportional-duration strip above a measure. One segment per frame, its width the
 * fraction of the bar the frame lasts. A ringing frame reads as a filled bar; a rest as
 * a hollow one — so "held for two beats then a beat of silence" is visible at a glance.
 */
function DurationBar({
  measure,
  totalBeats,
  activeFrame,
  onSelect,
}: {
  measure: MeasureType;
  totalBeats: number;
  activeFrame: number | null;
  onSelect: (frame: number) => void;
}) {
  return (
    <div className="flex h-2 w-full gap-px mb-1">
      {measure.frames.map((frame, frameIndex) => {
        const rest = isRestFrame(frame);
        const isActive = frameIndex === activeFrame;
        return (
          <button
            key={frame.id}
            onClick={() => onSelect(frameIndex)}
            title={`${frameDuration(frame)} beat(s)${rest ? " · rest" : ""}`}
            style={{ width: `${widthPercent(frame, totalBeats)}%` }}
            className={`h-full rounded-[1px] cursor-pointer transition-colors ${
              rest
                ? `border border-dashed ${isActive ? "border-blue" : "border-border"}`
                : isActive
                  ? "bg-blue"
                  : "bg-foreground/40 hover:bg-foreground/60"
            }`}
          />
        );
      })}
    </div>
  );
}

export default function TabDisplay() {
  const {
    tab,
    position,
    details,
    selection,
    stringCount,
    updatePosition,
    addFrameAndAdvance,
    addNewMeasure,
    renameSection,
    deleteSection,
  } = useTabEditor();

  const bounds = selectionBounds(tab, selection);
  const fallbackMeter: TimeSignatureType = details.timeSignature;
  const stringRows = Array.from({ length: stringCount }, (_unused, i) => i);

  const isCurrentFrame = (pos: FramePosition) =>
    position.section === pos.section &&
    position.measure === pos.measure &&
    position.frame === pos.frame;

  return (
    <>
      {tab.sections.map((section, sectionIndex) => {
        const measureOffset = sectionMeasureOffset(tab, sectionIndex);
        const measureRange =
          section.measures.length === 1
            ? `Measure ${measureOffset + 1}`
            : `Measures ${measureOffset + 1}–${measureOffset + section.measures.length}`;

        const incompleteMeasures = section.measures.filter(
          (measure) =>
            !measureIsComplete(measure, measureTimeSignature(measure, fallbackMeter))
        ).length;

        // Running ordinal so a frame's selection index is known without a lookup.
        let ordinal = frameOrdinalOf(tab, {
          section: sectionIndex,
          measure: 0,
          frame: 0,
        });

        return (
          <section key={section.id} className="mt-10 first:mt-2">
            <header className="flex items-center gap-2 border-b border-border pb-1">
              <input
                aria-label={`Section ${sectionIndex + 1} name`}
                value={section.name}
                onChange={(event) => renameSection(sectionIndex, event.target.value)}
                className={`min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none rounded px-1 py-0.5 hover:bg-foreground/5 focus:bg-foreground/5 ${
                  position.section === sectionIndex
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              />
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {measureRange}
              </span>
              {incompleteMeasures > 0 && (
                <span
                  title={`${incompleteMeasures} measure(s) don't fill their meter`}
                  className="text-xs text-muted-foreground/70 tabular-nums shrink-0">
                  {`${incompleteMeasures} off-meter`}
                </span>
              )}
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

            <div className="flex flex-wrap items-start gap-x-3 gap-y-10 mt-8">
              {section.measures.map((measure, measureIndex) => {
                const meter = measureTimeSignature(measure, fallbackMeter);
                const totalBeats = measureBeats(measure);
                const hasMeterOverride = measure.timeSignature !== undefined;
                const isCursorMeasure =
                  position.section === sectionIndex && position.measure === measureIndex;
                const activeFrame =
                  isCursorMeasure ? position.frame : null;
                const measureStartOrdinal = ordinal;
                ordinal += measure.frames.length;

                return (
                  <div
                    key={measureIndex}
                    className="flex flex-col border-l border-border pl-2 pr-1 last:border-r last:pr-2"
                    style={{ minWidth: `${Math.max(measure.frames.length * 2.5, 4)}em` }}>
                    <DurationBar
                      measure={measure}
                      totalBeats={totalBeats}
                      activeFrame={activeFrame}
                      onSelect={(frame) =>
                        updatePosition(sectionIndex, measureIndex, frame)
                      }
                    />

                    <div className="flex text-xs">
                      {measure.frames.map((frame, frameIndex) => {
                        const framePosition: FramePosition = {
                          section: sectionIndex,
                          measure: measureIndex,
                          frame: frameIndex,
                        };
                        const current = isCurrentFrame(framePosition);
                        const selected = isInSelection(
                          measureStartOrdinal + frameIndex,
                          bounds
                        );
                        const rest = isRestFrame(frame);

                        return (
                          <button
                            key={frame.id}
                            aria-label={`Section ${sectionIndex + 1} Measure ${
                              measureIndex + 1
                            } Frame ${frameIndex + 1}`}
                            title={`${frameDuration(frame)} beat(s)${
                              rest ? " · rest" : ""
                            } — bar totals ${totalBeats}`}
                            onClick={() =>
                              updatePosition(sectionIndex, measureIndex, frameIndex)
                            }
                            style={{ width: `${widthPercent(frame, totalBeats)}%` }}
                            className={`flex flex-col justify-center rounded-sm border border-transparent hover:border-border ${
                              current ? "bg-accent" : ""
                            } ${selected ? "bg-primary/20" : ""}`}>
                            {rest ? (
                              <span
                                className="td-rest flex items-center justify-center text-muted-foreground/70 select-none"
                                style={{ minHeight: `${stringCount}em` }}>
                                𝄽
                              </span>
                            ) : (
                              stringRows.map((stringIndex) => {
                                const note = frame.notes[stringIndex];
                                return (
                                  <p
                                    key={stringIndex}
                                    className={`td-grid-note z-2 text-foreground ${
                                      current && position.string === stringIndex
                                        ? "bg-primary/20 rounded-sm"
                                        : ""
                                    }`}>
                                    {note ? fretLabel(note.fret, note.style) : " "}
                                  </p>
                                );
                              })
                            )}
                          </button>
                        );
                      })}

                      <button
                        aria-label={`Add frame to measure ${measureIndex + 1}`}
                        title="Add frame"
                        onClick={() =>
                          addFrameAndAdvance(
                            sectionIndex,
                            measureIndex,
                            measure.frames.length - 1,
                            true
                          )
                        }
                        className="self-stretch px-1 text-muted-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-sm cursor-pointer">
                        <PlusIcon size={12} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1.5 text-[10px] text-muted-foreground tabular-nums">
                      <span>{measureIndex + measureOffset + 1}</span>
                      <span
                        title={
                          hasMeterOverride
                            ? "This bar overrides the tab meter"
                            : "Inherited from the tab meter"
                        }
                        className={hasMeterOverride ? "text-foreground font-medium" : ""}>
                        {meter[0]}/{meter[1]}
                      </span>
                    </div>
                  </div>
                );
              })}

              <button
                aria-label="Add measure"
                title="Add measure"
                onClick={() => addNewMeasure(sectionIndex, section.measures.length)}
                className="self-center p-2 text-muted-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-sm cursor-pointer">
                <PlusIcon size={16} />
              </button>
            </div>
          </section>
        );
      })}
    </>
  );
}
