import { MAX_FRET_NUMBER } from "@tablab/shared";
import type { TabPositionType } from "../shared/types/utilities.types";

/** How long a lone digit waits for a second one before it commits on its own. */
const SECOND_DIGIT_WINDOW_MS = 200;

/**
 * Typing fret numbers from the keyboard, one digit at a time.
 *
 * A digit is held briefly in case a second follows: `1` then `2` makes fret 12. A pair
 * past the highest fret can't be one fret, so `3` then `5` commits 3 and holds the 5.
 *
 * A held digit belongs to the note it was typed on. It commits there even if the cursor
 * has moved, and a digit typed on another note commits it first. `flush` commits it now
 * (do this before any other edit, so edits land in the order they were typed); `cancel`
 * drops it.
 */
export type FretEntry = {
  push(target: TabPositionType, digit: number): void;
  flush(): void;
  cancel(): void;
};

export function createFretEntry(
  commit: (target: TabPositionType, fret: number) => void,
): FretEntry {
  let held: { target: TabPositionType; digit: number } | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function stopTimer() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function hold(target: TabPositionType, digit: number) {
    held = { target, digit };
    timer = setTimeout(flush, SECOND_DIGIT_WINDOW_MS);
  }

  function flush() {
    stopTimer();
    if (!held) return;
    const { target, digit } = held;
    held = null;
    commit(target, digit);
  }

  function cancel() {
    stopTimer();
    held = null;
  }

  function push(target: TabPositionType, digit: number) {
    if (held && !sameNote(held.target, target)) flush();
    if (!held) {
      hold(target, digit);
      return;
    }

    // A second digit on the same note.
    const first = held.digit;
    cancel();
    const pair = first * 10 + digit;
    if (pair <= MAX_FRET_NUMBER) {
      commit(target, pair);
      return;
    }
    commit(target, first);
    hold(target, digit);
  }

  return { push, flush, cancel };
}

function sameNote(a: TabPositionType, b: TabPositionType): boolean {
  return (
    a.section === b.section &&
    a.measure === b.measure &&
    a.frame === b.frame &&
    a.string === b.string
  );
}
