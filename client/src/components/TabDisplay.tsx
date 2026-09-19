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
  MeasureType,
  TabBodyType,
  TimeSignatureType,
} from "../shared/types/tab.types";
import type { TabSelectionType } from "../shared/types/utilities.types";
import { NoteValueIcon } from "./NoteValueIcon";

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
  const value = fret === -2 ? "" : fret === -1 ? "X" : String(fret);
  if (value === "") return "";
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

/** Trims a beat count for display: 4 stays "4", 3.5 stays "3.5", 1.25 → "1.25". */
function formatBeats(beats: number): string {
  return String(Number(beats.toFixed(2)));
}

/** Width a whole beat occupies, so the bar reads as a ruler: a quarter is always the
 * same width across the tab, an eighth always half of it. */
const EM_PER_BEAT = 3.5;
/** Floor so a very short note stays wide enough to click and to show its icon. */
const MIN_COLUMN_EM = 1.4;
/**
 * Frame columns abut (no gap) so a multi-frame selection reads as one continuous block
 * and the staff lines never break. The bar and the staff share this, so they stay aligned.
 */
const COLUMN_GAP = "0px";

/**
 * Grid columns for a measure. Every frame gets an explicit width from its duration (so a
 * half note is literally twice a quarter, at the same scale as every other bar), floored
 * so short notes stay legible. When the bar doesn't fill its meter, a trailing column
 * holds the empty remainder — that gap is how an under-full bar reads as under-full. The
 * duration bar and the note staff render on this exact template, so they line up.
 */
function columnsFor(measure: MeasureType, meterBeats: number): string {
  const columns = measure.frames.map(
    (frame) => `${Math.max(frameDuration(frame) * EM_PER_BEAT, MIN_COLUMN_EM)}em`
  );
  const remainder = meterBeats - measureBeats(measure);
  if (remainder > 1e-6) columns.push(`${remainder * EM_PER_BEAT}em`);
  return columns.join(" ");
}

/**
 * The rhythm strip above a measure: one cell per frame on the same grid as the notes
 * below, each showing the note-value glyph so a quarter, eighth and sixteenth are
 * distinguishable even when narrow. Rests read as a dashed cell with a rest glyph.
 */
function DurationBar({
  measure,
  columns,
  activeFrame,
  onSelect,
}: {
  measure: MeasureType;
  columns: string;
  activeFrame: number | null;
  onSelect: (frame: number) => void;
}) {
  return (
    <div
      className="grid h-5 mb-1.5"
      style={{ gridTemplateColumns: columns, columnGap: COLUMN_GAP }}>
      {measure.frames.map((frame, frameIndex) => {
        const rest = isRestFrame(frame);
        const isActive = frameIndex === activeFrame;
        return (
          <button
            key={frame.id}
            onClick={() => onSelect(frameIndex)}
            title={`${frameDuration(frame)} beat(s)${rest ? " · rest" : ""}`}
            className={`flex items-center justify-center overflow-hidden cursor-pointer ${
              // The active cell takes a full border so all four sides turn blue; the rest
              // share single dividers (each draws its right edge, the first its left too).
              isActive ? "border" : "border-y border-r first:border-l"
            } ${rest ? "border-dashed" : ""} ${
              isActive
                ? "border-blue bg-blue/15 text-blue"
                : "border-border text-foreground/70 hover:bg-foreground/5"
            }`}>
            {rest ? (
              <span className="leading-none select-none">𝄽</span>
            ) : (
              <NoteValueIcon beats={frameDuration(frame)} className="h-3.5 w-3.5" />
            )}
          </button>
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
                const meterBeats = meter[0] * (4 / meter[1]);
                const totalBeats = measureBeats(measure);
                const complete = measureIsComplete(measure, meter);
                const overfull = totalBeats > meterBeats + 1e-6;
                const hasMeterOverride = measure.timeSignature !== undefined;
                const isCursorMeasure =
                  position.section === sectionIndex && position.measure === measureIndex;
                const activeFrame = isCursorMeasure ? position.frame : null;
                const measureStartOrdinal = ordinal;
                ordinal += measure.frames.length;

                const columns = columnsFor(measure, meterBeats);

                return (
                  <div
                    key={measureIndex}
                    className={`flex flex-col border-l pl-2 pr-1 last:border-r last:pr-2 ${
                      overfull ? "border-destructive/60" : "border-border"
                    }`}>
                    <DurationBar
                      measure={measure}
                      columns={columns}
                      activeFrame={activeFrame}
                      onSelect={(frame) =>
                        updatePosition(sectionIndex, measureIndex, frame)
                      }
                    />

                    {/* Continuous staff lines behind the columns, so the gaps between
                        frames never break the strings. */}
                    <div
                      className="td-staff relative"
                      style={{ height: `calc(var(--td-row-h) * ${stringCount})` }}>
                      <div
                        className="grid h-full"
                        style={{ gridTemplateColumns: columns, columnGap: COLUMN_GAP }}>
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
                          // Round only the outer edge of a selected run: a selected frame
                          // whose neighbour in the same measure is also selected keeps a
                          // square edge there, so the block reads as one shape.
                          const joinLeft =
                            selected &&
                            frameIndex > 0 &&
                            isInSelection(measureStartOrdinal + frameIndex - 1, bounds);
                          const joinRight =
                            selected &&
                            frameIndex < measure.frames.length - 1 &&
                            isInSelection(measureStartOrdinal + frameIndex + 1, bounds);
                          const rounding = `${joinLeft ? "rounded-l-none" : "rounded-l-sm"} ${
                            joinRight ? "rounded-r-none" : "rounded-r-sm"
                          }`;

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
                              className={`h-full flex flex-col ${rounding} cursor-pointer ${
                                selected
                                  ? current
                                    ? "bg-primary/35"
                                    : "bg-primary/20"
                                  : current
                                    ? "bg-blue/15 outline outline-1 outline-blue/50"
                                    : "hover:bg-foreground/5"
                              }`}>
                              {rest ? (
                                <span className="td-rest flex-1 flex items-center justify-center text-lg text-muted-foreground/70 select-none">
                                  𝄽
                                </span>
                              ) : (
                                stringRows.map((stringIndex) => {
                                  const note = frame.notes[stringIndex];
                                  return (
                                    <span
                                      key={stringIndex}
                                      className={`td-note-cell text-xs text-foreground tabular-nums ${
                                        current && position.string === stringIndex
                                          ? "bg-primary/30 rounded-sm"
                                          : ""
                                      }`}>
                                      {note ? fretLabel(note.fret, note.style) : ""}
                                    </span>
                                  );
                                })
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2 text-[10px] text-muted-foreground tabular-nums">
                      <span>{measureIndex + measureOffset + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          aria-label={`Add frame to measure ${measureIndex + 1}`}
                          title="Add frame to this measure"
                          onClick={() =>
                            addFrameAndAdvance(
                              sectionIndex,
                              measureIndex,
                              measure.frames.length - 1,
                              true
                            )
                          }
                          className="flex items-center rounded-sm p-0.5 text-muted-foreground/50 hover:text-foreground hover:bg-foreground/10 cursor-pointer">
                          <PlusIcon size={11} />
                        </button>
                        {!complete && (
                          <span
                            title={`This bar holds ${formatBeats(totalBeats)} of ${formatBeats(
                              meterBeats
                            )} beats`}
                            className={overfull ? "text-destructive" : "text-amber-600 dark:text-amber-500"}>
                            {formatBeats(totalBeats)}/{formatBeats(meterBeats)}
                          </span>
                        )}
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
