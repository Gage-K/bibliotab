import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { LinkSimpleIcon, LinkBreakIcon } from "@phosphor-icons/react";
import { useTabEditor } from "../../context/tabEditorProvider";
import { collectFrameIds, getFrame } from "../../utils/tabOperations";
import { FrameAnchorMark } from "./FrameAnchorMark";
import type { LyricsDocType } from "../../shared/types/tab.types";

/** How long editing pauses before the document is pushed into editor state. */
const SAVE_DEBOUNCE_MS = 400;

/**
 * Lyric editor with syllable-to-frame bindings.
 *
 * Select a syllable, press Bind, and it is marked with the current frame's id. Clicking
 * a bound syllable moves the cursor to that frame. Ids rather than indices means the
 * binding survives measures moving between sections and frames being inserted before
 * it.
 */
export default function LyricEditor() {
  const { tab, lyrics, position, setLyrics, goToFrameById } = useTabEditor();
  const [hasSelection, setHasSelection] = useState(false);

  // The current frame's id is what a Bind writes; read it at click time so the mark
  // reflects wherever the cursor is then.
  const currentFrame = getFrame(
    tab,
    position.section,
    position.measure,
    position.frame,
  );

  const frameIds = useMemo(() => collectFrameIds(tab), [tab]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setLyricsRef = useRef(setLyrics);
  setLyricsRef.current = setLyrics;

  const scheduleSave = useCallback((doc: LyricsDocType) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    // Every keystroke produces a new document; debouncing keeps the reducer (and the
    // unsaved-changes flag) from churning on each one.
    saveTimerRef.current = setTimeout(() => {
      setLyricsRef.current(doc);
    }, SAVE_DEBOUNCE_MS);
  }, []);

  const editor = useEditor({
    extensions: [StarterKit, FrameAnchorMark],
    // LyricsDocType is deliberately opaque in the domain types, so it is cast at the
    // one boundary where Tiptap's own schema types apply.
    content: (lyrics ?? "") as never,
    editorProps: {
      attributes: {
        class:
          "min-h-32 p-2 text-sm outline-none [&_p]:my-1 [&_.lyric-anchor]:bg-blue/25 [&_.lyric-anchor]:rounded-sm [&_.lyric-anchor]:cursor-pointer [&_.lyric-anchor]:underline [&_.lyric-anchor]:decoration-dotted",
      },
      handleClick: (view, _pos, event) => {
        const target = event.target as HTMLElement | null;
        const anchor = target?.closest<HTMLElement>("[data-frame-id]");
        const frameId = anchor?.dataset.frameId;
        if (!frameId) return false;
        goToFrameById(frameId);
        // Let the click also place the text cursor, so binding stays editable.
        return false;
      },
    },
    onUpdate: ({ editor: current }) => {
      scheduleSave(current.getJSON() as LyricsDocType);
    },
    onSelectionUpdate: ({ editor: current }) => {
      setHasSelection(!current.state.selection.empty);
    },
  });

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  // Content is only pushed in when the editor is created; a later external change (a
  // different tab loading into the same mount) has to be applied explicitly.
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!editor || loadedRef.current || !lyrics) return;
    loadedRef.current = true;
    editor.commands.setContent(lyrics as never);
  }, [editor, lyrics]);

  const boundFrameId = editor?.getAttributes("frameAnchor").frameId as
    | string
    | undefined;
  // A binding to a frame that has since been deleted is inert, and says so.
  const boundFrameExists = boundFrameId ? frameIds.has(boundFrameId) : false;

  function bindSelection() {
    if (!editor || !currentFrame) return;
    editor.chain().focus().setFrameAnchor(currentFrame.id).run();
  }

  function unbindSelection() {
    editor?.chain().focus().unsetFrameAnchor().run();
  }

  const buttonStyle =
    "flex items-center gap-1 px-2 py-1 text-xs rounded border border-border hover:bg-foreground/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <section className="mt-8">
      <header className="flex items-center gap-2 border-b border-border pb-1 mb-2">
        <h2 className="text-sm font-semibold flex-1">Lyrics</h2>

        <button
          className={buttonStyle}
          onClick={bindSelection}
          disabled={!hasSelection || !currentFrame}
          title={
            !currentFrame
              ? "Put the cursor on a frame first"
              : !hasSelection
                ? "Select the syllable to bind"
                : `Bind to section ${position.section + 1}, measure ${
                    position.measure + 1
                  }, frame ${position.frame + 1}`
          }>
          <LinkSimpleIcon size={12} />
          Bind to frame
        </button>

        <button
          className={buttonStyle}
          onClick={unbindSelection}
          disabled={!boundFrameId}
          title="Remove the binding on the selected text">
          <LinkBreakIcon size={12} />
          Unbind
        </button>
      </header>

      {boundFrameId && !boundFrameExists && (
        <p className="text-xs text-muted-foreground mb-1">
          This syllable is bound to a frame that no longer exists.
        </p>
      )}

      <div className="border border-border rounded-sm focus-within:border-foreground/40">
        <EditorContent editor={editor} />
      </div>

      <p className="text-xs text-muted-foreground mt-1">
        Select a syllable and bind it to the current frame. Click a highlighted syllable
        to jump the cursor there.
      </p>
    </section>
  );
}
