import { useEffect } from "react";
import { PlayIcon, StopIcon } from "@phosphor-icons/react";
import { useTabEditor } from "../context/tabEditorProvider";
import { useTabPlayback } from "../hooks/useTabPlayback";
import { MIN_BPM, MAX_BPM } from "../shared/types/consts";

/**
 * Transport for the tab. Every track sounds; the cursor follows the active one.
 */
/** Class the sounding syllable carries; styling lives with the lyric editor. */
const ACTIVE_ANCHOR_CLASS = "lyric-anchor-active";

/**
 * Highlights the lyric syllables bound to the frame currently sounding.
 *
 * Reaching into the DOM rather than routing through React state is deliberate: this
 * fires once per frame during playback, and re-rendering the lyric document at that
 * rate would fight the editor for control of its own content.
 */
function highlightLyricAnchor(frameId: string) {
  document
    .querySelectorAll(`.${ACTIVE_ANCHOR_CLASS}`)
    .forEach((element) => element.classList.remove(ACTIVE_ANCHOR_CLASS));
  document
    .querySelectorAll(`[data-frame-id="${CSS.escape(frameId)}"]`)
    .forEach((element) => element.classList.add(ACTIVE_ANCHOR_CLASS));
}

export default function PlaybackControls({
  buttonClassName,
  iconSize = 16,
}: {
  buttonClassName: string;
  iconSize?: number;
}) {
  const { tracks, activeTrack, details, setBpm, updatePosition } = useTabEditor();
  const bpm = details.bpm;

  const { isPlaying, toggle, totalSteps } = useTabPlayback({
    tracks,
    activeTrack,
    bpm,
    onStep: (position) =>
      updatePosition(position.section, position.measure, position.frame),
    onFrameSound: highlightLyricAnchor,
  });

  const isEmpty = totalSteps === 0;

  // Leaving a stale highlight behind after stopping would suggest playback is still
  // somewhere in the song.
  useEffect(() => {
    if (isPlaying) return;
    document
      .querySelectorAll(`.${ACTIVE_ANCHOR_CLASS}`)
      .forEach((element) => element.classList.remove(ACTIVE_ANCHOR_CLASS));
  }, [isPlaying]);

  return (
    <div className="flex items-center gap-2">
      <button
        className={buttonClassName}
        onClick={toggle}
        disabled={isEmpty}
        title={isPlaying ? "Stop" : "Play"}>
        <span className="sr-only">{isPlaying ? "Stop" : "Play"}</span>
        {isPlaying ? <StopIcon size={iconSize} /> : <PlayIcon size={iconSize} />}
      </button>

      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="sr-only">Tempo</span>
        <input
          type="range"
          min={MIN_BPM}
          max={MAX_BPM}
          value={bpm}
          onChange={(event) => setBpm(Number(event.target.value))}
          className="w-20 cursor-pointer accent-current"
          aria-label="Tempo in beats per minute"
        />
        <span className="tabular-nums w-14 shrink-0">{bpm} bpm</span>
      </label>
    </div>
  );
}
