import { useState } from "react";
import { SkeletonLine, SkeletonText } from "./Skeleton";
import TabDetails from "./TabDetails";
import TrackBar from "./TrackBar";
import Editor from "./Editor";
import TabDisplay from "./TabDisplay";
import NotesPanel from "./NotesPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { useTabEditor } from "../context/tabEditorProvider";

const TAB_STORAGE_KEY = "bibliotab:editor-panel";

/** Remembers the last open panel across reloads; tolerant of storage being unavailable. */
function rememberedPanel(): string {
  try {
    return localStorage.getItem(TAB_STORAGE_KEY) ?? "tablature";
  } catch {
    return "tablature";
  }
}

export default function TabEditorLayout() {
  const { isLoading } = useTabEditor();
  const [panel, setPanel] = useState(rememberedPanel);

  function selectPanel(value: string) {
    setPanel(value);
    try {
      localStorage.setItem(TAB_STORAGE_KEY, value);
    } catch {
      // Private mode / blocked storage: the choice just won't persist.
    }
  }

  return isLoading ? (
    <>
      <SkeletonLine />
      <SkeletonText />
      <SkeletonText />
    </>
  ) : (
    <>
      <TabDetails />
      <Tabs value={panel} onValueChange={selectPanel} className="mt-4">
        <TabsList>
          <TabsTrigger value="tablature">Tablature</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="tablature">
          <TrackBar />
          <Editor />
          <TabDisplay />
        </TabsContent>
        <TabsContent value="notes">
          <NotesPanel />
        </TabsContent>
      </Tabs>
    </>
  );
}
