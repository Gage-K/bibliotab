import { useParams } from "react-router";
import { TabEditorProvider } from "../context/tabEditorProvider";
import TabEditorLayout from "./TabEditorLayout";

export default function MainTabEditor() {
  const { tabId } = useParams();

  return (
    <TabEditorProvider tabId={tabId!}>
      <TabEditorLayout />
    </TabEditorProvider>
  );
}
