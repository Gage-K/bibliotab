import { describe, it, expect } from "vitest";
import { tabEditorReducer, initialTabEditorState } from "../tabEditorReducer";
import type { TabEditorState } from "../tabEditorReducer";
import { createEmptyFrame, createSection } from "../../utils/tabOperations";
import type { MeasureType, TabBodyType } from "@/shared/types/tab.types";

function measure(frames: number): MeasureType {
  return Array.from({ length: frames }, () => createEmptyFrame());
}

function body(...sections: { name: string; measures: number[] }[]): TabBodyType {
  return {
    sections: sections.map((s) =>
      createSection(
        s.name,
        s.measures.map((frames) => measure(frames)),
      ),
    ),
  };
}

function stateWith(
  tab: TabBodyType,
  position: Partial<TabEditorState["position"]> = {},
): TabEditorState {
  return {
    ...initialTabEditorState,
    tab,
    position: { section: 0, measure: 0, frame: 0, string: 0, ...position },
  };
}

describe("SET_POSITION across section boundaries", () => {
  const tab = body({ name: "Intro", measures: [2, 2] }, { name: "Verse", measures: [2] });

  it("moves to the next measure inside the section", () => {
    const state = stateWith(tab, { measure: 0, frame: 1 });
    const next = tabEditorReducer(state, {
      type: "SET_POSITION",
      payload: { section: 0, measure: 0, frame: 2 },
    });
    expect(next.position).toMatchObject({ section: 0, measure: 1, frame: 0 });
  });

  it("falls into the next section past the last measure", () => {
    const state = stateWith(tab, { measure: 1, frame: 1 });
    const next = tabEditorReducer(state, {
      type: "SET_POSITION",
      payload: { section: 0, measure: 1, frame: 2 },
    });
    expect(next.position).toMatchObject({ section: 1, measure: 0, frame: 0 });
  });

  it("falls back into the previous section's last frame", () => {
    const state = stateWith(tab, { section: 1, measure: 0, frame: 0 });
    const next = tabEditorReducer(state, {
      type: "SET_POSITION",
      payload: { section: 1, measure: 0, frame: -1 },
    });
    expect(next.position).toMatchObject({ section: 0, measure: 1, frame: 1 });
  });

  it("stays put at the very start and the very end", () => {
    const start = stateWith(tab);
    expect(
      tabEditorReducer(start, { type: "SET_POSITION", payload: { section: 0, measure: 0, frame: -1 } }),
    ).toBe(start);

    const end = stateWith(tab, { section: 1, measure: 0, frame: 1 });
    expect(
      tabEditorReducer(end, { type: "SET_POSITION", payload: { section: 1, measure: 0, frame: 2 } }),
    ).toBe(end);
  });
});

describe("frame and measure edits stay inside their section", () => {
  it("writes notes only to the addressed section", () => {
    const tab = body({ name: "Intro", measures: [1] }, { name: "Verse", measures: [1] });
    const next = tabEditorReducer(stateWith(tab, { section: 1 }), {
      type: "SET_NOTE_FRET",
      payload: { section: 1, measure: 0, frame: 0, string: 0, fret: 5 },
    });

    expect(next.tab.sections[1].measures[0][0].notes[0].fret).toBe(5);
    expect(next.tab.sections[0]).toBe(tab.sections[0]);
    expect(next.isEditing).toBe(true);
  });

  it("deletes a measure when its last frame goes", () => {
    const tab = body({ name: "Intro", measures: [1, 1] });
    const next = tabEditorReducer(stateWith(tab, { measure: 1 }), {
      type: "DELETE_FRAME",
      payload: { section: 0, measure: 1, frame: 0 },
    });

    expect(next.tab.sections[0].measures).toHaveLength(1);
    expect(next.position).toMatchObject({ section: 0, measure: 0, frame: 0 });
  });

  it("refuses to empty a section — its last frame stays", () => {
    const tab = body({ name: "Intro", measures: [1] }, { name: "Verse", measures: [1] });
    const state = stateWith(tab);
    expect(
      tabEditorReducer(state, { type: "DELETE_FRAME", payload: { section: 0, measure: 0, frame: 0 } }),
    ).toBe(state);
  });
});

describe("section actions", () => {
  it("adds a section and moves the cursor into it", () => {
    const tab = body({ name: "Intro", measures: [2] });
    const next = tabEditorReducer(stateWith(tab, { frame: 1 }), {
      type: "ADD_SECTION",
      payload: { index: 1, name: "Verse" },
    });

    expect(next.tab.sections.map((s) => s.name)).toEqual(["Intro", "Verse"]);
    expect(next.position).toMatchObject({ section: 1, measure: 0, frame: 0 });
  });

  it("renames a section", () => {
    const tab = body({ name: "Intro", measures: [1] });
    const next = tabEditorReducer(stateWith(tab), {
      type: "RENAME_SECTION",
      payload: { index: 0, name: "Chorus" },
    });
    expect(next.tab.sections[0].name).toBe("Chorus");
  });

  it("deletes a section and pulls the cursor back into range", () => {
    const tab = body(
      { name: "Intro", measures: [1] },
      { name: "Verse", measures: [1] },
      { name: "Outro", measures: [1] },
    );
    const next = tabEditorReducer(stateWith(tab, { section: 2 }), {
      type: "DELETE_SECTION",
      payload: { index: 1 },
    });

    expect(next.tab.sections.map((s) => s.name)).toEqual(["Intro", "Outro"]);
    expect(next.position).toMatchObject({ section: 1, measure: 0, frame: 0 });
  });

  it("leaves the cursor alone when a later section is deleted", () => {
    const tab = body(
      { name: "Intro", measures: [2] },
      { name: "Verse", measures: [1] },
    );
    const next = tabEditorReducer(stateWith(tab, { section: 0, measure: 0, frame: 1 }), {
      type: "DELETE_SECTION",
      payload: { index: 1 },
    });

    expect(next.tab.sections.map((s) => s.name)).toEqual(["Intro"]);
    expect(next.position).toMatchObject({ section: 0, measure: 0, frame: 1 });
  });

  it("keeps the last section", () => {
    const state = stateWith(body({ name: "Intro", measures: [1] }));
    expect(tabEditorReducer(state, { type: "DELETE_SECTION", payload: { index: 0 } })).toBe(state);
  });

  it("moves a measure and follows it with the cursor", () => {
    const tab = body({ name: "Intro", measures: [1, 2] }, { name: "Verse", measures: [3] });
    const next = tabEditorReducer(stateWith(tab, { measure: 1 }), {
      type: "MOVE_MEASURE",
      payload: { from: { section: 0, measure: 1 }, to: { section: 1, measure: 0 } },
    });

    expect(next.tab.sections[0].measures).toHaveLength(1);
    expect(next.tab.sections[1].measures.map((m) => m.length)).toEqual([2, 3]);
    expect(next.position).toMatchObject({ section: 1, measure: 0, frame: 0 });
  });
});

describe("selection", () => {
  it("anchors on the current position and extends across measures", () => {
    const tab = body({ name: "Intro", measures: [2, 2] });
    const extended = tabEditorReducer(stateWith(tab, { frame: 1 }), {
      type: "EXTEND_SELECTION",
      payload: { section: 0, measure: 1, frame: 0 },
    });

    expect(extended.selection?.anchor).toMatchObject({ section: 0, measure: 0, frame: 1 });
    expect(extended.selection?.head).toMatchObject({ section: 0, measure: 1, frame: 0 });
  });

  it("ignores a target that does not exist", () => {
    const tab = body({ name: "Intro", measures: [1] });
    const state = stateWith(tab);
    expect(
      tabEditorReducer(state, { type: "EXTEND_SELECTION", payload: { section: 0, measure: 0, frame: 5 } }),
    ).toBe(state);
  });
});

describe("changing tuning changes the string count", () => {
  const tab = body({ name: "Intro", measures: [2] });

  it("reshapes every frame and clamps the cursor when switching to a bass", () => {
    const state = stateWith(tab, { string: 5 });
    const next = tabEditorReducer(state, {
      type: "UPDATE_DETAILS",
      payload: { name: "tuning", value: ["G", "D", "A", "E"] },
    });

    expect(next.details.tuning).toHaveLength(4);
    for (const frame of next.tab.sections[0].measures[0]) {
      expect(frame.notes).toHaveLength(4);
    }
    // The cursor was on string 6, which no longer exists.
    expect(next.position.string).toBe(3);
  });

  it("leaves non-tuning detail edits alone", () => {
    const state = stateWith(tab);
    const next = tabEditorReducer(state, {
      type: "UPDATE_DETAILS",
      payload: { name: "song", value: "Renamed" },
    });

    expect(next.tab).toBe(state.tab);
    expect(next.details.song).toBe("Renamed");
  });

  it("clamps SET_STRING to the current string count", () => {
    const state: TabEditorState = {
      ...stateWith(tab),
      details: { ...initialTabEditorState.details, tuning: ["G", "D", "A", "E"] },
    };

    expect(
      tabEditorReducer(state, { type: "SET_STRING", payload: { string: 3 } }).position.string,
    ).toBe(3);
    // String 5 exists on a guitar but not on a 4-string bass.
    expect(
      tabEditorReducer(state, { type: "SET_STRING", payload: { string: 4 } }).position.string,
    ).toBe(0);
  });

  it("builds new sections and measures at the current string count", () => {
    const state: TabEditorState = {
      ...stateWith({ sections: [createSection("Intro", [[createEmptyFrame(4)]])] }),
      details: { ...initialTabEditorState.details, tuning: ["G", "D", "A", "E"] },
    };

    const withSection = tabEditorReducer(state, {
      type: "ADD_SECTION",
      payload: { index: 1, name: "Verse" },
    });
    expect(withSection.tab.sections[1].measures[0][0].notes).toHaveLength(4);

    const withMeasure = tabEditorReducer(state, {
      type: "ADD_MEASURE",
      payload: { section: 0, measure: 1 },
    });
    expect(withMeasure.tab.sections[0].measures[1][0].notes).toHaveLength(4);
  });
});
