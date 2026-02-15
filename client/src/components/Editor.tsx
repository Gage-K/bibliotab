import TabForm from "./TabForm";
import EditorControls from "./EditorControls";
import { useTabEditor } from "../hooks/useTabEditor";

export default function Editor() {
  const { editorIsOpen } = useTabEditor();

  return (
    <section className="sticky top-12 border border-neutral-800 px-1 md:px-3 rounded bg-neutral-800 text-neutral-50 font-medium text-xs z-100 shadow-md">
      <EditorControls />
      {editorIsOpen && <TabForm />}
    </section>
  );
}
