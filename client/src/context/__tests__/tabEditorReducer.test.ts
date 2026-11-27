import { describe, it, expect } from "vitest";
import { tabEditorReducer, initialTabEditorState, activeBody } from "../tabEditorReducer";
import type { TabEditorState } from "../tabEditorReducer";
import { createEmptyFrame, createSection } from "../../utils/tabOperations";
import { createTrack } from "../../utils/trackOperations";
import type { MeasureType, TabBodyType, TuningType } from "@tablab/shared";

function measure(frames: number): MeasureType {
  return { frames: Array.from({ length: frames }, () => createEmptyFrame()) };
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

// Single-track state, which is what every pre-tracks assertion is really about.
function stateWith(
  tab: TabBodyType,
  position: Partial<TabEditorState["position"]> = {},
  tuning?: TuningType,
): TabEditorState {
  return {
    ...initialTabEditorState,
    tracks: [createTrack({ name: "Track 1", body: tab, tuning })],
    activeTrack: 0,
    position: { section: 0, measure: 0, frame: 0, string: 0, ...position },
  };
}

// Where each motion lands is tested with the Cursor module (utils/__tests__/cursor.test.ts).
// These cover what the reducer adds: the body it moves through, and the selection.
describe("MOVE_CURSOR", () => {
  const tab = body({ name: "Intro", measures: [2, 2] }, { name: "Verse", measures: [2] });

  // Selects the cursor's frame and the one after it.
  const withSelection = (state: TabEditorState): TabEditorState => ({
    ...state,
    selection: {
      anchor: { ...state.position },
      head: { ...state.position, frame: state.position.frame + 1 },
    },
  });

  it("moves through the active track's body, across section boundaries", () => {
    const state = stateWith(tab, { measure: 1, frame: 1 });
    const next = tabEditorReducer(state, {
      type: "MOVE_CURSOR",
      payload: { by: "frame", delta: 1 },
    });
    expect(next.position).toEqual({ section: 1, measure: 0, frame: 0, string: 0 });
  });

  it("returns the same state when the cursor has nowhere to go", () => {
    const start = stateWith(tab);
    expect(
      tabEditorReducer(start, { type: "MOVE_CURSOR", payload: { by: "frame", delta: -1 } }),
    ).toBe(start);
  });

  it("ends the selection when moving between frames", () => {
    const state = withSelection(stateWith(tab));
    const next = tabEditorReducer(state, {
      type: "MOVE_CURSOR",
      payload: { by: "measureStart", delta: 1 },
    });
    expect(next.selection).toBeNull();
  });

  it("ends the selection on a click, even a click on the current frame", () => {
    const state = withSelection(stateWith(tab));
    const next = tabEditorReducer(state, {
      type: "MOVE_CURSOR",
      payload: { to: { section: 0, measure: 0, frame: 0 } },
    });
    expect(next.selection).toBeNull();
  });

  it("keeps the selection when moving along the strings", () => {
    const state = withSelection(stateWith(tab));
    const next = tabEditorReducer(state, {
      type: "MOVE_CURSOR",
      payload: { by: "string", delta: 1 },
    });
    expect(next.position.string).toBe(1);
    expect(next.selection).toBe(state.selection);
  });
});

describe("CLEAR_SELECTION", () => {
  const tab = body({ name: "Intro", measures: [2] });

  it("drops the selection and leaves the cursor where it is", () => {
    const state: TabEditorState = {
      ...stateWith(tab, { frame: 1 }),
      selection: {
        anchor: { section: 0, measure: 0, frame: 0, string: 0 },
        head: { section: 0, measure: 0, frame: 1, string: 0 },
      },
    };
    const next = tabEditorReducer(state, { type: "CLEAR_SELECTION" });
    expect(next.selection).toBeNull();
    expect(next.position).toBe(state.position);
  });

  it("returns the same state when nothing is selected", () => {
    const state = stateWith(tab);
    expect(tabEditorReducer(state, { type: "CLEAR_SELECTION" })).toBe(state);
  });
});

describe("frame and measure edits stay inside their section", () => {
  it("writes notes only to the addressed section", () => {
    const tab = body({ name: "Intro", measures: [1] }, { name: "Verse", measures: [1] });
    const next = tabEditorReducer(stateWith(tab, { section: 1 }), {
      type: "SET_NOTE_FRET",
      payload: { section: 1, measure: 0, frame: 0, string: 0, fret: 5 },
    });

    expect(activeBody(next).sections[1].measures[0].frames[0].notes[0].fret).toBe(5);
    expect(activeBody(next).sections[0]).toBe(tab.sections[0]);
    expect(next.isEditing).toBe(true);
  });

  it("deletes a measure when its last frame goes", () => {
    const tab = body({ name: "Intro", measures: [1, 1] });
    const next = tabEditorReducer(stateWith(tab, { measure: 1 }), {
      type: "DELETE_FRAME",
      payload: { section: 0, measure: 1, frame: 0 },
    });

    expect(activeBody(next).sections[0].measures).toHaveLength(1);
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

    expect(activeBody(next).sections.map((s) => s.name)).toEqual(["Intro", "Verse"]);
    expect(next.position).toMatchObject({ section: 1, measure: 0, frame: 0 });
  });

  it("renames a section", () => {
    const tab = body({ name: "Intro", measures: [1] });
    const next = tabEditorReducer(stateWith(tab), {
      type: "RENAME_SECTION",
      payload: { index: 0, name: "Chorus" },
    });
    expect(activeBody(next).sections[0].name).toBe("Chorus");
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

    expect(activeBody(next).sections.map((s) => s.name)).toEqual(["Intro", "Outro"]);
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

    expect(activeBody(next).sections.map((s) => s.name)).toEqual(["Intro"]);
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

    expect(activeBody(next).sections[0].measures).toHaveLength(1);
    expect(activeBody(next).sections[1].measures.map((m) => m.frames.length)).toEqual([2, 3]);
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

const BASS_TUNING = ["G", "D", "A", "E"] as TuningType;

describe("changing a track's tuning changes its string count", () => {
  const tab = body({ name: "Intro", measures: [2] });

  it("reshapes every frame and clamps the cursor when switching to a bass", () => {
    const state = stateWith(tab, { string: 5 });
    const next = tabEditorReducer(state, {
      type: "SET_TRACK_TUNING",
      payload: { index: 0, tuning: BASS_TUNING },
    });

    expect(next.tracks[0].tuning).toHaveLength(4);
    for (const frame of activeBody(next).sections[0].measures[0].frames) {
      expect(frame.notes).toHaveLength(4);
    }
    // The cursor was on string 6, which no longer exists.
    expect(next.position.string).toBe(3);
  });

  it("reconciles octaves with the new string count", () => {
    const state = stateWith(tab);
    const next = tabEditorReducer(state, {
      type: "SET_TRACK_TUNING",
      payload: { index: 0, tuning: BASS_TUNING },
    });

    expect(next.tracks[0].octaves).toHaveLength(4);
  });

  it("leaves detail edits alone", () => {
    const state = stateWith(tab);
    const next = tabEditorReducer(state, {
      type: "UPDATE_DETAILS",
      payload: { name: "song", value: "Renamed" },
    });

    expect(activeBody(next)).toBe(activeBody(state));
    expect(next.details.song).toBe("Renamed");
  });

  it("stops the cursor at the track's own bottom string", () => {
    const down = { type: "MOVE_CURSOR", payload: { by: "string", delta: 1 } } as const;

    const onThird = stateWith(tab, { string: 2 }, BASS_TUNING);
    expect(tabEditorReducer(onThird, down).position.string).toBe(3);
    // A guitar has a fifth string; a 4-string bass does not.
    const onFourth = stateWith(tab, { string: 3 }, BASS_TUNING);
    expect(tabEditorReducer(onFourth, down)).toBe(onFourth);
  });

  it("builds new sections and measures at the current string count", () => {
    const state = stateWith(
      { sections: [createSection("Intro", [{ frames: [createEmptyFrame(4)] }])] },
      {},
      BASS_TUNING,
    );

    const withSection = tabEditorReducer(state, {
      type: "ADD_SECTION",
      payload: { index: 1, name: "Verse" },
    });
    expect(activeBody(withSection).sections[1].measures[0].frames[0].notes).toHaveLength(4);

    const withMeasure = tabEditorReducer(state, {
      type: "ADD_MEASURE",
      payload: { section: 0, measure: 1 },
    });
    expect(activeBody(withMeasure).sections[0].measures[1].frames[0].notes).toHaveLength(4);
  });
});

describe("track actions", () => {
  function twoTrackState(): TabEditorState {
    return {
      ...initialTabEditorState,
      tracks: [
        createTrack({ name: "Guitar", body: body({ name: "Intro", measures: [2] }) }),
        createTrack({
          name: "Bass",
          instrument: "bass",
          tuning: BASS_TUNING,
          body: {
            sections: [createSection("Intro", [{ frames: [createEmptyFrame(4)] }])],
          },
        }),
      ],
      activeTrack: 0,
      position: { section: 0, measure: 0, frame: 1, string: 3 },
    };
  }

  it("edits only the active track", () => {
    const state = twoTrackState();
    const next = tabEditorReducer(state, {
      type: "SET_NOTE_FRET",
      payload: { section: 0, measure: 0, frame: 0, string: 0, fret: 5 },
    });

    expect(next.tracks[0].body.sections[0].measures[0].frames[0].notes[0].fret).toBe(5);
    expect(next.tracks[1]).toBe(state.tracks[1]);
  });

  it("resets the cursor when switching tracks", () => {
    const state = twoTrackState();
    const next = tabEditorReducer(state, {
      type: "SET_ACTIVE_TRACK",
      payload: { index: 1 },
    });

    expect(next.activeTrack).toBe(1);
    // Frame 1 / string 3 exist in the guitar track but not in the one-frame bass track.
    expect(next.position).toEqual({ section: 0, measure: 0, frame: 0, string: 0 });
  });

  it("ignores a switch to a track that does not exist", () => {
    const state = twoTrackState();
    expect(
      tabEditorReducer(state, { type: "SET_ACTIVE_TRACK", payload: { index: 5 } }),
    ).toBe(state);
  });

  it("adds a track and makes it active", () => {
    const state = twoTrackState();
    const next = tabEditorReducer(state, {
      type: "ADD_TRACK",
      payload: { name: "Uke", instrument: "ukulele", tuning: ["A", "E", "C", "G"] },
    });

    expect(next.tracks).toHaveLength(3);
    expect(next.activeTrack).toBe(2);
    expect(next.tracks[2].body.sections[0].measures[0].frames[0].notes).toHaveLength(4);
  });

  it("shifts the active index when an earlier track is removed", () => {
    const state = { ...twoTrackState(), activeTrack: 1 };
    const next = tabEditorReducer(state, {
      type: "REMOVE_TRACK",
      payload: { index: 0 },
    });

    expect(next.tracks).toHaveLength(1);
    expect(next.tracks[0].name).toBe("Bass");
    expect(next.activeTrack).toBe(0);
  });

  it("refuses to remove the last track", () => {
    const state = stateWith(body({ name: "Intro", measures: [1] }));
    expect(tabEditorReducer(state, { type: "REMOVE_TRACK", payload: { index: 0 } })).toBe(
      state,
    );
  });

  it("retunes an inactive track without moving the cursor", () => {
    const state = twoTrackState();
    const next = tabEditorReducer(state, {
      type: "SET_TRACK_TUNING",
      payload: { index: 1, tuning: ["G", "D", "A", "E", "B"] },
    });

    expect(next.tracks[1].tuning).toHaveLength(5);
    expect(next.tracks[1].body.sections[0].measures[0].frames[0].notes).toHaveLength(5);
    expect(next.position).toBe(state.position);
  });
});

// The note under the cursor, read back from state.
function noteAtCursor(state: TabEditorState) {
  const { section, measure, frame, string } = state.position;
  return activeBody(state).sections[section].measures[measure].frames[frame].notes[string];
}

function withFret(state: TabEditorState, fret: number): TabEditorState {
  return tabEditorReducer(state, {
    type: "SET_NOTE_FRET",
    payload: { ...state.position, fret },
  });
}

describe("styling the note at the cursor", () => {
  const tab = body({ name: "Intro", measures: [2] });
  const toggle = (style: "bend" | "slide") =>
    ({ type: "TOGGLE_NOTE_STYLE", payload: { style } }) as const;

  it("styles a fretted note, and the same style again takes it off", () => {
    const fretted = withFret(stateWith(tab, { frame: 1, string: 2 }), 5);
    const bent = tabEditorReducer(fretted, toggle("bend"));
    expect(noteAtCursor(bent)).toEqual({ fret: 5, style: "bend" });
    expect(bent.isEditing).toBe(true);

    expect(noteAtCursor(tabEditorReducer(bent, toggle("bend"))).style).toBe("none");
  });

  it("switches straight from one style to another", () => {
    const bent = tabEditorReducer(withFret(stateWith(tab), 7), toggle("bend"));
    expect(noteAtCursor(tabEditorReducer(bent, toggle("slide"))).style).toBe("slide");
  });

  it("ignores an empty or a muted note", () => {
    const empty = stateWith(tab);
    expect(tabEditorReducer(empty, toggle("bend"))).toBe(empty);
    const muted = withFret(stateWith(tab), -1);
    expect(tabEditorReducer(muted, toggle("bend"))).toBe(muted);
  });

  it("styles a fret entered just before it", () => {
    // Typing 5 then z quickly used to drop the bend: the style was decided from the tab
    // as last drawn, where the note was still empty.
    const next = tabEditorReducer(withFret(stateWith(tab), 5), toggle("bend"));
    expect(noteAtCursor(next)).toEqual({ fret: 5, style: "bend" });
  });
});

describe("changing the duration at the cursor", () => {
  const tab = body({ name: "Intro", measures: [2] });
  const adjust = (by: "longer" | "shorter" | "dot") =>
    ({ type: "ADJUST_FRAME_DURATION", payload: { adjust: by } }) as const;
  const durations = (state: TabEditorState) =>
    activeBody(state).sections[0].measures[0].frames.map((frame) => frame.duration);

  it("steps the cursor's frame to the next longer or shorter note value", () => {
    // New frames are quarter notes (1 beat).
    const state = stateWith(tab, { frame: 1 });
    expect(durations(tabEditorReducer(state, adjust("longer")))).toEqual([1, 2]);
    expect(durations(tabEditorReducer(state, adjust("shorter")))).toEqual([1, 0.5]);
  });

  it("dots the note, and dotting again takes the dot off", () => {
    const dotted = tabEditorReducer(stateWith(tab), adjust("dot"));
    expect(durations(dotted)).toEqual([1.5, 1]);
    expect(dotted.isEditing).toBe(true);
    expect(durations(tabEditorReducer(dotted, adjust("dot")))).toEqual([1, 1]);
  });
});

describe("notes", () => {
  const tab = body({ name: "Intro", measures: [1] });

  it("stores notes and flags the tab as edited", () => {
    const next = tabEditorReducer(stateWith(tab), {
      type: "SET_NOTES",
      payload: { notes: "Capo 2" },
    });
    expect(next.notes).toBe("Capo 2");
    expect(next.isEditing).toBe(true);
  });

  it("ignores an unchanged notes write", () => {
    // The notes textarea fires on every keystroke; an identical value shouldn't mark
    // the tab dirty.
    const state = { ...stateWith(tab), notes: "Capo 2" };
    expect(
      tabEditorReducer(state, { type: "SET_NOTES", payload: { notes: "Capo 2" } }),
    ).toBe(state);
  });
});

describe("rests and per-measure meter", () => {
  it("marks a frame a rest on the active track", () => {
    const tab = body({ name: "Intro", measures: [1] });
    const next = tabEditorReducer(stateWith(tab), {
      type: "SET_FRAME_REST",
      payload: { section: 0, measure: 0, frame: 0, isRest: true },
    });
    expect(activeBody(next).sections[0].measures[0].frames[0].isRest).toBe(true);
    expect(next.isEditing).toBe(true);
  });

  it("overrides and clears a measure's meter", () => {
    const tab = body({ name: "Intro", measures: [1] });
    const overridden = tabEditorReducer(stateWith(tab), {
      type: "SET_MEASURE_TIME_SIGNATURE",
      payload: { section: 0, measure: 0, timeSignature: [5, 4] },
    });
    expect(activeBody(overridden).sections[0].measures[0].timeSignature).toEqual([5, 4]);

    const cleared = tabEditorReducer(overridden, {
      type: "SET_MEASURE_TIME_SIGNATURE",
      payload: { section: 0, measure: 0, timeSignature: null },
    });
    expect(activeBody(cleared).sections[0].measures[0].timeSignature).toBeUndefined();
  });
});

// The insert-before keys were once an insert followed by a MOVE_CURSOR back onto the
// original frame. These pin the single actions to what that pair did.
describe("insert-before actions", () => {
  const tab = body({ name: "Intro", measures: [2, 3] });
  const selected = (state: TabEditorState): TabEditorState => ({
    ...state,
    selection: { anchor: { ...state.position }, head: { ...state.position, frame: 0 } },
  });
  // Ignores fresh frame ids, which differ between any two inserts.
  const shape = (state: TabEditorState) => ({
    ...state,
    tracks: state.tracks.map((track) => ({
      ...track,
      body: {
        sections: track.body.sections.map((s) => ({
          ...s,
          measures: s.measures.map((m) => ({ ...m, frames: m.frames.map((f) => f.notes) })),
        })),
      },
    })),
  });

  it("ADD_FRAME_BEFORE inserts before the cursor and keeps it on its frame", () => {
    const state = selected(stateWith(tab, { measure: 1, frame: 2, string: 3 }));
    const next = tabEditorReducer(state, {
      type: "ADD_FRAME_BEFORE",
      payload: { section: 0, measure: 1, frame: 2 },
    });

    expect(activeBody(next).sections[0].measures[1].frames).toHaveLength(4);
    expect(activeBody(next).sections[0].measures[1].frames[3].id).toBe(
      tab.sections[0].measures[1].frames[2].id,
    );
    expect(next.position).toEqual({ section: 0, measure: 1, frame: 3, string: 3 });
    expect(next.selection).toBeNull();
    expect(next.isEditing).toBe(true);

    const before = tabEditorReducer(state, {
      type: "ADD_FRAME",
      payload: { section: 0, measure: 1, frame: 1, isEmpty: true },
    });
    const pair = tabEditorReducer(before, {
      type: "MOVE_CURSOR",
      payload: { to: { section: 0, measure: 1, frame: 3 } },
    });
    expect(shape(next)).toEqual(shape(pair));
  });

  it("ADD_MEASURE_BEFORE inserts before the cursor's measure and keeps it on its frame", () => {
    const state = selected(stateWith(tab, { measure: 1, frame: 2, string: 3 }));
    const next = tabEditorReducer(state, {
      type: "ADD_MEASURE_BEFORE",
      payload: { section: 0, measure: 1, frame: 2 },
    });

    expect(activeBody(next).sections[0].measures.map((m) => m.frames.length)).toEqual([2, 1, 3]);
    // The string goes back to the first, as ADD_MEASURE has always left it.
    expect(next.position).toEqual({ section: 0, measure: 2, frame: 2, string: 0 });
    expect(next.selection).toBeNull();
    expect(next.isEditing).toBe(true);

    const before = tabEditorReducer(state, {
      type: "ADD_MEASURE",
      payload: { section: 0, measure: 1 },
    });
    const pair = tabEditorReducer(before, {
      type: "MOVE_CURSOR",
      payload: { to: { section: 0, measure: 2, frame: 2 } },
    });
    expect(shape(next)).toEqual(shape(pair));
  });
});
