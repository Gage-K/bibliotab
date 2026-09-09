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
