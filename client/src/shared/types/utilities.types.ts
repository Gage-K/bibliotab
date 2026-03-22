export type TabPositionType = {
  measure: number;
  frame: number;
  string: number;
};

export type TabSelectionType = {
  anchor: TabPositionType;
  head: TabPositionType;
} | null;
