import { useState } from "react";
import Markdown from "react-markdown";
import { EyeIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { useTabEditor } from "../context/tabEditorProvider";
import { MAX_NOTES_LENGTH } from "../shared/types/consts";

/**
 * Freeform markdown notes for the tab — tuning quirks, gear, "capo 2", whatever.
 *
 * Rendered through react-markdown rather than a markdown-to-HTML string, so nothing is
 * ever handed to dangerouslySetInnerHTML: raw HTML in the source is inert.
 */
export default function NotesPanel() {
  const { notes, setNotes } = useTabEditor();
  const [isPreviewing, setIsPreviewing] = useState(false);

  const remaining = MAX_NOTES_LENGTH - notes.length;

  return (
    <section className="mt-8">
      <header className="flex items-center gap-2 border-b border-border pb-1 mb-2">
        <h2 className="text-sm font-semibold flex-1">Notes</h2>
        {remaining < 1000 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {remaining} characters left
          </span>
        )}
        <button
          onClick={() => setIsPreviewing((previewing) => !previewing)}
          title={isPreviewing ? "Edit notes" : "Preview notes"}
          className="p-1 rounded hover:bg-foreground/10 cursor-pointer">
          <span className="sr-only">{isPreviewing ? "Edit" : "Preview"}</span>
          {isPreviewing ? <PencilSimpleIcon size={14} /> : <EyeIcon size={14} />}
        </button>
      </header>

      {isPreviewing ? (
        <div className="prose-sm max-w-none text-sm text-foreground [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:bg-foreground/10 [&_code]:px-1 [&_code]:rounded [&_a]:underline [&_p]:my-2">
          {notes.trim() ? (
            <Markdown>{notes}</Markdown>
          ) : (
            <p className="text-muted-foreground">Nothing here yet.</p>
          )}
        </div>
      ) : (
        <textarea
          value={notes}
          maxLength={MAX_NOTES_LENGTH}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Markdown notes — capo position, gear, anything worth remembering."
          className="w-full min-h-40 p-2 text-sm font-mono border border-border rounded-sm bg-transparent text-foreground resize-y outline-none focus:border-foreground/40"
        />
      )}
    </section>
  );
}
