import TabForm from "./TabForm";
import EditorControls from "./EditorControls";
import { useTabEditor } from "../context/tabEditorProvider";

export default function Editor() {
  const { editorIsOpen } = useTabEditor();

  return (
    <section className="sticky top-12 border border-border px-1 md:px-3 rounded bg-secondary text-secondary-foreground font-medium text-xs z-10 shadow-md">
      <EditorControls />
      {editorIsOpen && <TabForm />}
    </section>
  );
}
