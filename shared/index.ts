// Types
export * from "./types/tab.types";

// Constants
export * from "./constants/tab.constants";

// Utils
export * from "./utils/tab.serializer";
export * from "./utils/tuning";

// CI failure check: a type error both packages see.
export const ciBreak: number = "not a number";
