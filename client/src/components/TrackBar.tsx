import { useState } from "react";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useTabEditor } from "../context/tabEditorProvider";
import { INSTRUMENT_PRESETS, MAX_TRACKS } from "@tablab/shared";
import type { TuningType } from "@tablab/shared";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
} from "./ui/dropdown-menu";

/**
 * Track switcher. One track renders as a plain label rather than a tab strip, so a
 * single-instrument tab looks the way it did before tracks existed.
 */
export default function TrackBar() {
  const { tracks, activeTrack, setActiveTrack, addTrack, removeTrack, renameTrack } =
    useTabEditor();
  const [renamingTrack, setRenamingTrack] = useState<number | null>(null);

  function handleAdd(presetId: string) {
    const preset = INSTRUMENT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    addTrack({
      name: preset.instrument.charAt(0).toUpperCase() + preset.instrument.slice(1),
      instrument: preset.instrument,
      tuning: [...preset.tuning] as TuningType,
      octaves: [...preset.octaves],
    });
  }

  return (
    <div className="flex items-end gap-1 border-b border-border mb-4 overflow-x-auto">
      {tracks.map((track, index) => {
        const isActive = index === activeTrack;
        return (
          <div
            key={track.id}
            className={`group flex items-center gap-1 px-3 py-1.5 rounded-t border-b-2 shrink-0 ${
              isActive
                ? "border-b-foreground text-foreground"
                : "border-b-transparent text-muted-foreground hover:bg-foreground/5"
            }`}>
            {renamingTrack === index ? (
              <input
                autoFocus
                aria-label={`Rename ${track.name}`}
                value={track.name}
                onChange={(event) => renameTrack(index, event.target.value)}
                onBlur={() => setRenamingTrack(null)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === "Escape") {
                    setRenamingTrack(null);
                  }
                }}
                className="w-28 bg-transparent text-sm font-medium outline-none"
              />
            ) : (
              <button
                onClick={() => setActiveTrack(index)}
                onDoubleClick={() => setRenamingTrack(index)}
                title="Double-click to rename"
                className="text-sm font-medium cursor-pointer whitespace-nowrap">
                {track.name}
                <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                  {track.tuning.length}-string
                </span>
              </button>
            )}

            {tracks.length > 1 && (
              <button
                aria-label={`Delete ${track.name}`}
                onClick={() => removeTrack(index)}
                className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-foreground/10 cursor-pointer">
                <TrashIcon size={12} />
              </button>
            )}
          </div>
        );
      })}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            disabled={tracks.length >= MAX_TRACKS}
            title={
              tracks.length >= MAX_TRACKS
                ? `A tab holds at most ${MAX_TRACKS} tracks`
                : "Add a track"
            }
            className="ml-1 mb-1 p-1.5 rounded hover:bg-foreground/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
            <span className="sr-only">Add track</span>
            <PlusIcon size={14} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-56">
          <DropdownMenuLabel className="text-xs">New track</DropdownMenuLabel>
          {INSTRUMENT_PRESETS.map((preset) => (
            <DropdownMenuItem key={preset.id} onSelect={() => handleAdd(preset.id)}>
              {`${preset.label} (${preset.tuning.length} strings)`}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
