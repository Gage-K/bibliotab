import type { TimeSignatureType } from "@tablab/shared";

// Editor-state types. The Tab document's own types live in @tablab/shared.

export type TabPositionType = {
  section: number;
  measure: number;
  frame: number;
  string: number;
};

export type TabSelectionType = {
  anchor: TabPositionType;
  head: TabPositionType;
} | null;

/** The tab-level fields the editor holds and edits; tuning belongs to each track. */
export type EditorDetailsType = {
  id: string;
  artist: string;
  song: string;
  bpm: number;
  timeSignature: TimeSignatureType;
};
