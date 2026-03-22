// Re-export shared types for convenience
export {
  TabEntity,
  TabType,
  TabResponse,
  CreateTabDto,
  UpdateTabDto,
  TuningType,
  TabBodyType,
  TabDetailsType,
  NoteFretType,
  NoteStyleType,
  FrameType,
  MeasureType,
} from "@tablab/shared";

// Legacy alias for migration compatibility (remove after full migration)
export type Tab = import("@tablab/shared").TabEntity;
export type TabTuning = import("@tablab/shared").TuningType;
