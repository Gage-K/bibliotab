import { PlayIcon, StopIcon } from "@phosphor-icons/react";
import { useTabEditor } from "../context/tabEditorProvider";
import { MIN_BPM, MAX_BPM } from "../shared/types/consts";

/**
 * Transport for the tab. Every track sounds through one Tone.Transport; the cursor
 * follows the active one.
 */
export default function PlaybackControls({
  buttonClassName,
  iconSize = 16,
}: {
  buttonClassName: string;
  iconSize?: number;
}) {
  const { details, isPlaying, togglePlayback, totalSteps, setBpm } = useTabEditor();

  const isEmpty = totalSteps === 0;

  return (
    <div className="flex items-center gap-2">
      <button
        className={buttonClassName}
        onClick={togglePlayback}
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
          value={details.bpm}
          onChange={(event) => setBpm(Number(event.target.value))}
          className="w-20 cursor-pointer accent-current"
          aria-label="Tempo in beats per minute"
        />
        <span className="tabular-nums w-14 shrink-0">{details.bpm} bpm</span>
      </label>
    </div>
  );
}
