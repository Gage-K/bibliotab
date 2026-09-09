import { useEffect } from "react";
import { useOrchid } from "../hooks/useOrchid";
import { PITCH_CLASS_NAMES } from "../utils/pitch";
import {
  EXTENSION_QUALITIES,
  QUALITY_LABELS,
  TRIAD_QUALITIES,
} from "../utils/orchid/buildChord";
import { ENGINE_VOICES } from "../utils/orchid/engine";
import { PERFORMANCE_MODES } from "../utils/orchid/perform";
import { MAX_BASE_OCTAVE, MIN_BASE_OCTAVE } from "../utils/orchid/voice";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Root keys mapped to the home row and the row above, laid out like a keyboard octave
 * so the black keys sit where a player expects them.
 */
const KEY_BINDINGS: Record<string, number> = {
  a: 0, // C
  w: 1,
  s: 2, // D
  e: 3,
  d: 4, // E
  f: 5, // F
  t: 6,
  g: 7, // G
  y: 8,
  h: 9, // A
  u: 10,
  j: 11, // B
};

const KEY_FOR_PITCH_CLASS = Object.fromEntries(
  Object.entries(KEY_BINDINGS).map(([key, pc]) => [pc, key]),
);

const IS_BLACK_KEY = [false, true, false, true, false, false, true, false, true, false, true, false];

export default function Orchid() {
  const { state, update, toggleQuality, play, release, lastChord } = useOrchid();

  // Playing from the keyboard is what makes this feel like an instrument rather than a
  // chord chart, so the bindings live at the window level.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      const rootPc = KEY_BINDINGS[event.key.toLowerCase()];
      if (rootPc === undefined) return;
      event.preventDefault();
      void play(rootPc);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [play]);

  // Leaving the page with an arp running would keep it looping with nothing on screen.
  useEffect(() => release, [release]);

  const controlLabel = "text-xs font-medium text-muted-foreground";
  const chip =
    "px-3 py-1.5 text-sm rounded border cursor-pointer transition-colors select-none";
  const chipOn = "bg-blue text-blue-foreground border-blue";
  const chipOff = "border-border hover:bg-foreground/10";

  return (
    <div className="flex flex-col gap-6 px-4 py-8 max-w-4xl mx-auto w-full">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Orchid</h1>
        <p className="text-muted-foreground mt-1">
          Pick a root, hold qualities to build a chord, and shape it with the voicing
          controls. Play from the on-screen keys or your keyboard.
        </p>
      </header>

      <Card>
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <span className={controlLabel}>Chord</span>
            <span className="text-2xl font-semibold tabular-nums">
              {lastChord?.name ?? "—"}
            </span>
          </div>

          <div className="flex gap-1">
            {PITCH_CLASS_NAMES.map((name, pitchClass) => (
              <button
                key={name}
                onPointerDown={() => void play(pitchClass)}
                title={`${name} (key: ${KEY_FOR_PITCH_CLASS[pitchClass]})`}
                className={`flex-1 rounded-b text-xs font-semibold cursor-pointer border border-border transition-colors ${
                  IS_BLACK_KEY[pitchClass]
                    ? "h-16 bg-foreground text-background hover:bg-foreground/80"
                    : "h-24 bg-background hover:bg-foreground/10"
                }`}>
                {name}
              </button>
            ))}
          </div>

          {lastChord && lastChord.notes.length > 0 && (
            <p className="text-xs text-muted-foreground tabular-nums">
              {lastChord.notes.join("  ")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className={controlLabel}>Triad</span>
            <div className="flex flex-wrap gap-2">
              {TRIAD_QUALITIES.map((quality) => (
                <button
                  key={quality}
                  onClick={() => toggleQuality(quality)}
                  className={`${chip} ${
                    state.qualities.includes(quality) ? chipOn : chipOff
                  }`}>
                  {QUALITY_LABELS[quality]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className={controlLabel}>Extensions (stackable)</span>
            <div className="flex flex-wrap gap-2">
              {EXTENSION_QUALITIES.map((quality) => (
                <button
                  key={quality}
                  onClick={() => toggleQuality(quality)}
                  className={`${chip} ${
                    state.qualities.includes(quality) ? chipOn : chipOff
                  }`}>
                  {QUALITY_LABELS[quality]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className={controlLabel} htmlFor="key-lock">
              Key lock — snaps any root to a chord in the key
            </label>
            <select
              id="key-lock"
              value={state.keyLock ?? ""}
              onChange={(event) =>
                update({
                  keyLock: event.target.value === "" ? null : Number(event.target.value),
                })
              }
              className="w-48 px-2 py-1 border border-border rounded-sm bg-muted text-muted-foreground">
              <option value="">Off</option>
              {PITCH_CLASS_NAMES.map((name, pitchClass) => (
                <option key={name} value={pitchClass}>
                  {`${name} major`}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className={controlLabel}>Voicing spread — {state.spread.toFixed(2)}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={state.spread}
              onChange={(event) => update({ spread: Number(event.target.value) })}
              className="cursor-pointer accent-current"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className={controlLabel}>Inversion — {state.inversion}</span>
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              value={state.inversion}
              onChange={(event) => update({ inversion: Number(event.target.value) })}
              className="cursor-pointer accent-current"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className={controlLabel}>Octave — {state.baseOctave}</span>
            <input
              type="range"
              min={MIN_BASE_OCTAVE}
              max={MAX_BASE_OCTAVE}
              step={1}
              value={state.baseOctave}
              onChange={(event) => update({ baseOctave: Number(event.target.value) })}
              className="cursor-pointer accent-current"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className={controlLabel}>Ambience — {state.ambience.toFixed(2)}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={state.ambience}
              onChange={(event) => update({ ambience: Number(event.target.value) })}
              className="cursor-pointer accent-current"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className={controlLabel}>Tempo — {state.bpm} bpm</span>
            <input
              type="range"
              min={40}
              max={200}
              step={1}
              value={state.bpm}
              onChange={(event) => update({ bpm: Number(event.target.value) })}
              className="cursor-pointer accent-current"
            />
          </label>

          <label className="flex items-center gap-2 self-end">
            <input
              type="checkbox"
              checked={state.bassEnabled}
              onChange={(event) => update({ bassEnabled: event.target.checked })}
              className="cursor-pointer"
            />
            <span className={controlLabel}>Bass voice</span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className={controlLabel}>Performance mode</span>
            <div className="flex flex-wrap gap-2">
              {PERFORMANCE_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => update({ mode: mode.id })}
                  title={mode.hint}
                  className={`${chip} ${state.mode === mode.id ? chipOn : chipOff}`}>
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className={controlLabel}>Sound</span>
            <div className="flex flex-wrap gap-2">
              {ENGINE_VOICES.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => update({ voice: voice.id })}
                  className={`${chip} ${state.voice === voice.id ? chipOn : chipOff}`}>
                  {voice.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={release}
            className="self-start px-3 py-1.5 text-sm rounded border border-border hover:bg-foreground/10 cursor-pointer">
            Stop
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
