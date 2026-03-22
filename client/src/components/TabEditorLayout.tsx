import { SkeletonLine, SkeletonText } from "./Skeleton";
import TabDetails from "./TabDetails";
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
      <Editor />
      <TabDisplay />
    </>
  );
}
