import { useState, useEffect, useMemo } from "react";
import { useTabEditor } from "../context/tabEditorProvider";
import type { NoteFretType } from "../shared/types/tab.types";
import { getFrame } from "../utils/tabOperations";
import { chordNameForFrame } from "../utils/chords";
import { noteNamesForFrame } from "../utils/pitch";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const STYLES: { value: NoteFretType["style"]; label: string }[] = [
  { value: "bend", label: "b" },
  { value: "slide", label: "/" },
  { value: "hammerOn", label: "h" },
  { value: "pullOff", label: "p" },
  { value: "harmonic", label: "<>" },
  { value: "tap", label: "t" },
];

export default function TabForm() {
  const { tab, position, details, stringCount, updateTabData, getEmptyFrame } =
    useTabEditor();

  // String 1 is the highest-pitched (tuning index 0); rows render lowest-first.
  const strings = useMemo(
    () => Array.from({ length: stringCount }, (_unused, i) => i + 1),
    [stringCount],
  );

  const currentNotes = useMemo(
    () =>
      getFrame(tab, position.section, position.measure, position.frame)?.notes ??
      getEmptyFrame().notes,
    [tab, position.section, position.measure, position.frame, getEmptyFrame],
  );

  const [formData, setFormData] = useState<NoteFretType[]>(currentNotes);

  useEffect(() => {
    setFormData(currentNotes);
  }, [currentNotes]);

  const chord = useMemo(
    () => chordNameForFrame(formData, details.tuning),
    [formData, details.tuning],
  );
  const noteNames = useMemo(
    () => noteNamesForFrame(formData, details.tuning),
    [formData, details.tuning],
  );

  function updateFret(value: string, string: number) {
    const parsed = parseInt(value);
    const fret =
      value === "" || isNaN(parsed) ? -2 : Math.min(24, Math.max(0, parsed));
    setFormData((prev) =>
      prev.map((item, index) =>
        index === string - 1
          ? { ...item, fret, style: fret < 0 ? "none" : item.style }
          : item,
      ),
    );
  }

  function toggleMute(pressed: boolean, string: number) {
    setFormData((prev) =>
      prev.map((item, index) =>
        index === string - 1
          ? { ...item, fret: pressed ? -1 : -2, style: "none" }
          : item,
      ),
    );
  }

  function updateStyle(value: string, string: number) {
    setFormData((prev) =>
      prev.map((item, index) =>
        index === string - 1
          ? { ...item, style: (value || "none") as NoteFretType["style"] }
          : item,
      ),
    );
  }

  function clearHandler(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setFormData(getEmptyFrame().notes);
  }

  function saveFormData(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateTabData(position.section, position.measure, position.frame, formData);
  }

  const buttonStyle = "px-2 py-2 border border-border rounded font-semibold";
  const saveButtonStyle = `bg-secondary text-secondary-foreground ${buttonStyle} hover:bg-secondary/80 cursor-pointer`;

  return (
    <form className="my-4" onSubmit={saveFormData}>
      <hr className="border-border mb-3" />
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-medium text-muted-foreground">Chord</span>
        <span className="text-sm font-semibold tabular-nums">
          {chord ?? "—"}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 mb-3">
        {strings.toReversed().map((string) => {
          const note = formData[string - 1];
          if (!note) return null;
          const hasFret = note.fret >= 0;
          const isMuted = note.fret === -1;
          const fretDisplay = note.fret >= 0 ? String(note.fret) : "";

          return (
            <div
              key={string}
              className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-foreground/5"
            >
              <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">
                String {string}
              </span>
              <span className="text-xs font-semibold text-foreground/70 w-6 shrink-0 text-center tabular-nums">
                {noteNames[string - 1] ?? ""}
              </span>
              <Input
                type="number"
                min="0"
                max="24"
                placeholder="—"
                value={fretDisplay}
                disabled={isMuted}
                onChange={(e) => updateFret(e.target.value, string)}
                className="w-14 h-7 text-xs text-center px-1 shrink-0"
              />
              <Toggle
                size="sm"
                variant="outline"
                pressed={isMuted}
                onPressedChange={(pressed) => toggleMute(pressed, string)}
                aria-label={`Mute string ${string}`}
                className="h-7 w-7 p-0 text-xs shrink-0 font-mono cursor-pointer data-[state=on]:bg-blue data-[state=on]:text-blue-foreground data-[state=on]:border-blue"
              >
                ✕
              </Toggle>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={hasFret ? note.style : ""}
                onValueChange={(value) => updateStyle(value, string)}
                disabled={!hasFret}
                className="gap-0 w-full"
              >
                {STYLES.map((s) => (
                  <ToggleGroupItem
                    key={s.value}
                    value={s.value}
                    className="h-7 flex-1 px-1.5 text-xs font-mono cursor-pointer data-[state=on]:bg-blue data-[state=on]:text-blue-foreground data-[state=on]:border-blue"
                  >
                    {s.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button className={saveButtonStyle}>Save</button>
        <button
          className={`${buttonStyle} hover:bg-foreground/10 cursor-pointer`}
          onClick={clearHandler}
        >
          Clear
        </button>
      </div>
    </form>
  );
}
