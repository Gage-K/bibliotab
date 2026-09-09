import { SkeletonLine, SkeletonText } from "./Skeleton";
import TabDetails from "./TabDetails";
import TrackBar from "./TrackBar";
import Editor from "./Editor";
import TabDisplay from "./TabDisplay";
import NotesPanel from "./NotesPanel";
import LyricEditor from "./lyrics/LyricEditor";
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
      <LyricEditor />
      <NotesPanel />
    </>
  );
}
