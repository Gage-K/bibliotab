
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { KbdGroup, Kbd } from "./ui/kbd"
import { KeyboardIcon } from "@phosphor-icons/react"
import { defaultKeymap, EditorAction, Keymap } from "@/shared/keymaps/defaultKeymap"

const LABEL_MAP: Partial<Record<EditorAction, string>> = {
  moveUp: "Move Up",
  moveDown: "Move Down",
  moveLeft: "Move Left",
  moveRight: "Move Right",
  nextMeasureStart: "Next Measure",
  prevMeasureStart: "Prev Measure",
  selectLeft: "Select Left",
  selectRight: "Select Right",
  clearNote: "Clear Note",
  muteNote: "Mute Note",
  styleBend: "Bend",
  styleSlide: "Slide",
  styleHammerOn: "Hammer On",
  stylePullOff: "Pull Off",
  styleHarmonic: "Harmonic",
  styleTap: "Tap",
  escape: "Deselect",
  addFrameAfter: "Add Frame After",
  addFrameBefore: "Add Frame Before",
  addMeasureAfter: "Add Measure After",
  addMeasureBefore: "Add Measure Before",
  deleteFrame: "Delete Frame",
  duplicateFrame: "Duplicate Frame",
}

const SHIFT_SYMBOLS: Record<string, string> = {
  "{": "[",
  "}": "]",
}

const GROUPS: { label: string; actions: EditorAction[] }[] = [
  { label: "Navigation", actions: ["moveUp", "moveDown", "moveLeft", "moveRight", "prevMeasureStart", "nextMeasureStart"] },
  { label: "Selection", actions: ["selectLeft", "selectRight"] },
  { label: "Note", actions: ["clearNote", "muteNote"] },
  { label: "Styles", actions: ["styleBend", "styleSlide", "styleHammerOn", "stylePullOff", "styleHarmonic", "styleTap"] },
  { label: "Frames & Measures", actions: ["addFrameAfter", "addFrameBefore", "addMeasureAfter", "addMeasureBefore", "deleteFrame", "duplicateFrame"] },
]

function invertKeymap(keymap: Keymap): Partial<Record<EditorAction, string>> {
  return Object.fromEntries(
    Object.entries(keymap).map(([key, action]) => [action, key])
  ) as Partial<Record<EditorAction, string>>
}

function KeybindRow({ action, keyChar }: { action: EditorAction; keyChar: string }) {
  const label = LABEL_MAP[action]
  if (!label) return null

  const isShiftAlpha = keyChar.length === 1 && keyChar === keyChar.toUpperCase() && keyChar !== keyChar.toLowerCase()
  const shiftBase = SHIFT_SYMBOLS[keyChar]
  const needsShift = isShiftAlpha || !!shiftBase
  const displayKey = shiftBase ?? (isShiftAlpha ? keyChar.toLowerCase() : keyChar)

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <KbdGroup>
        {needsShift && <><Kbd>Shift</Kbd><span className="text-xs text-muted-foreground">+</span></>}
        <Kbd>{displayKey}</Kbd>
      </KbdGroup>
    </div>
  )
}

export function KeybindDialog() {
  const actionToKey = invertKeymap(defaultKeymap)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost"><KeyboardIcon /></Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Keybinds</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 overflow-y-auto px-4 pb-4">
          {GROUPS.map(({ label, actions }) => (
            <div key={label} className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h3>
              <div className="flex flex-col gap-1">
                {actions.map(action => {
                  const keyChar = actionToKey[action]
                  if (!keyChar) return null
                  return <KeybindRow key={action} action={action} keyChar={keyChar} />
                })}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
