import Header from "./Header";
import PageWrapper from "../layouts/PageWrapper";
import { SkeletonLine, SkeletonText } from "./Skeleton";
import TabDetails from "./TabDetails";
import Editor from "./Editor";
import TabDisplay from "./TabDisplay";
import { useTabEditor } from "../hooks/useTabEditor";

export default function TabEditorLayout() {
  const { isLoading } = useTabEditor();

  return (
    <>
      <Header />
      <main className="min-h-screen pb-16">
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
      </main>
    </>
  );
}
