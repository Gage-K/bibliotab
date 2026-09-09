import { SkeletonLine, SkeletonText } from "./Skeleton";
import TabDetails from "./TabDetails";
import TrackBar from "./TrackBar";
import Editor from "./Editor";
import TabDisplay from "./TabDisplay";
import { useTabEditor } from "../context/tabEditorProvider";

export default function TabEditorLayout() {
  const { isLoading } = useTabEditor();

  return isLoading ? (
    <>
      <SkeletonLine />
      <SkeletonText />
      <SkeletonText />
    </>
  ) : (
    <>
      <TabDetails />
      <TrackBar />
      <Editor />
      <TabDisplay />
    </>
  );
}
