import { useMemo } from "react";
import { useTabEditor } from "../context/tabEditorProvider";
import {
  TICKS_PER_BEAT,
  barLineTicks,
  buildTimelines,
  frameAtTick,
  ticksToBeats,
  timelineEnd,
} from "../utils/timeline";
import { FRET_EMPTY, FRET_MUTED } from "../shared/types/consts";

/** Horizontal scale. Wide enough that a sixteenth is still a visible sliver. */
const PX_PER_BEAT = 56;
const ROW_HEIGHT = 14;

function fretLabel(fret: number): string {
  if (fret === FRET_EMPTY) return "";
  if (fret === FRET_MUTED) return "x";
  return String(fret);
}

/**
 * All tracks on one time axis.
 *
 * The stacked editor view aligns tracks by measure index, which breaks as soon as two
 * tracks subdivide a measure differently — a guitar in eighths and a bass in quarters
 * have the same measure numbers but their notes don't line up. Here every frame is
 * positioned by its absolute onset instead, so they do.
 */
export default function TimelineView() {
  const {
    tracks,
    activeTrack,
    details,
    position,
    playheadTick,
    setActiveTrack,
    updatePosition,
  } = useTabEditor();

  const timelines = useMemo(() => buildTimelines(tracks), [tracks]);
  const endTick = timelineEnd(timelines);
  const bars = useMemo(
    () => barLineTicks(endTick, details.timeSignature),
    [endTick, details.timeSignature],
  );

  const width = ticksToBeats(endTick) * PX_PER_BEAT;
  const tickToPx = (tick: number) => ticksToBeats(tick) * PX_PER_BEAT;

  if (tracks.length === 0) return null;

  return (
    <section className="mt-8">
      <header className="flex items-center gap-2 border-b border-border pb-1 mb-2">
        <h2 className="text-sm font-semibold flex-1">Timeline</h2>
        <span className="text-xs text-muted-foreground">
          Aligned by time, not measure number
        </span>
      </header>

      <div className="overflow-x-auto">
        <div className="relative" style={{ width: Math.max(width, 200) }}>
          {/* Bar ruler, shared by every track. */}
          <div className="relative h-5 border-b border-border">
            {bars.map((tick, index) => (
              <div
                key={tick}
                className="absolute top-0 h-full border-l border-border"
                style={{ left: tickToPx(tick) }}>
                <span className="pl-1 text-[10px] text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>

          {timelines.map((timeline) => {
            const isActive = timeline.trackIndex === activeTrack;
            const soundingFrame =
              playheadTick === null ? null : frameAtTick(timeline, playheadTick);

            return (
              <div
                key={timeline.track.id}
                className={`relative border-b border-border ${
                  isActive ? "" : "opacity-60"
                }`}
                style={{ height: timeline.track.tuning.length * ROW_HEIGHT + 20 }}>
                <button
                  onClick={() => setActiveTrack(timeline.trackIndex)}
                  className="sticky left-0 z-10 px-1 text-[10px] font-medium text-muted-foreground hover:text-foreground cursor-pointer">
                  {timeline.track.name}
                </button>

                {/* Bar lines continue through each track, so the grid reads as one. */}
                {bars.map((tick) => (
                  <div
                    key={tick}
                    className="absolute top-0 bottom-0 border-l border-border/40"
                    style={{ left: tickToPx(tick) }}
                  />
                ))}

                {timeline.frames.map((frame) => {
                  const isCursor =
                    isActive &&
                    frame.position.section === position.section &&
                    frame.position.measure === position.measure &&
                    frame.position.frame === position.frame;
                  const isSounding = soundingFrame?.step === frame.step;

                  return (
                    <button
                      key={frame.frame.id}
                      onClick={() => {
                        setActiveTrack(timeline.trackIndex);
                        updatePosition(
                          frame.position.section,
                          frame.position.measure,
                          frame.position.frame,
                        );
                      }}
                      title={`${frame.beats} beat(s)`}
                      className={`absolute top-4 flex flex-col items-center justify-start rounded-sm text-[10px] leading-[14px] tabular-nums cursor-pointer border ${
                        isSounding
                          ? "bg-blue/40 border-blue"
                          : isCursor
                            ? "bg-accent border-border"
                            : "border-transparent hover:border-border"
                      }`}
                      style={{
                        left: tickToPx(frame.startTick),
                        // Width is proportional to duration, so a held note visibly
                        // spans the onsets of shorter notes in other tracks.
                        width: Math.max(tickToPx(frame.durationTicks) - 2, 8),
                        height: timeline.track.tuning.length * ROW_HEIGHT,
                      }}>
                      {frame.frame.notes.map((note, stringIndex) => (
                        <span key={stringIndex} className="block h-[14px]">
                          {fretLabel(note.fret)}
                        </span>
                      ))}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* One playhead across every track. */}
          {playheadTick !== null && playheadTick <= endTick && (
            <div
              className="absolute top-0 bottom-0 w-px bg-blue pointer-events-none"
              style={{ left: tickToPx(playheadTick) }}
            />
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-1 tabular-nums">
        {`${ticksToBeats(endTick)} beats at ${details.bpm} bpm · ${
          TICKS_PER_BEAT
        } ticks per beat`}
      </p>
    </section>
  );
}
