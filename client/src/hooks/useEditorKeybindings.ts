import { useEffect, useCallback } from "react";
import {
  defaultKeymap,
  type Keymap,
  type EditorAction,
} from "../shared/keymaps/defaultKeymap";

function isFormElement(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "SELECT" ||
    tag === "TEXTAREA" ||
    target.isContentEditable
  );
}

export function useEditorKeybindings(
  onAction: (action: EditorAction) => void,
  enabled: boolean = true,
  keymap: Keymap = defaultKeymap
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;
      if (isFormElement(event)) return;

      const key = event.key;

      // Ignore modifier-only keys and ctrl/meta/alt combos (allow shift through)
      if (
        key === "Shift" ||
        key === "Control" ||
        key === "Alt" ||
        key === "Meta"
      )
        return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const action = keymap[key];
      if (action) {
        event.preventDefault();
        onAction(action);
      }
    },
    [enabled, keymap, onAction]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}
