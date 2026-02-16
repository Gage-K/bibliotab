import PageWrapper from "../layouts/PageWrapper";
import { SkeletonLine, SkeletonText } from "./Skeleton";
import TabDetails from "./TabDetails";
import Editor from "./Editor";
import TabDisplay from "./TabDisplay";
import { useTabEditor } from "../context/tabEditorProvider";

export default function TabEditorLayout() {
  const { isLoading } = useTabEditor();

  return (
    <PageWrapper>
      {isLoading ? (
        <>
          <SkeletonLine />
          <SkeletonText />
          <SkeletonText />
        </>
      ) : (
        <div className="mx-auto h-full">
          <div className="editor-top h-full">
            <TabDetails />
          </div>
          <Editor />
          <TabDisplay />
        </div>
      )}
    </PageWrapper>
  );
}
