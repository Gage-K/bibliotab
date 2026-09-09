import { Mark, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    frameAnchor: {
      setFrameAnchor: (frameId: string) => ReturnType;
      unsetFrameAnchor: () => ReturnType;
    };
  }
}

/**
 * Binds a run of lyric text to a frame in the transcription.
 *
 * The anchor is the frame's nanoid, never its section/measure/frame indices: measures
 * move between sections and frames get inserted and deleted, but an id stays with its
 * frame. A binding whose frame is later deleted simply resolves to nothing rather than
 * silently pointing at whatever slid into that index.
 */
export const FrameAnchorMark = Mark.create({
  name: "frameAnchor",

  // Two different frames can't be bound to overlapping text, and re-binding a
  // selection should replace rather than nest.
  excludes: "frameAnchor",

  addAttributes() {
    return {
      frameId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-frame-id"),
        renderHTML: (attributes) =>
          attributes.frameId ? { "data-frame-id": attributes.frameId } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-frame-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { class: "lyric-anchor" }),
      0,
    ];
  },

  addCommands() {
    return {
      setFrameAnchor:
        (frameId: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { frameId }),
      unsetFrameAnchor:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
