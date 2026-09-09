import { describe, it, expect } from "vitest";
import {
  normalizeTabBody,
  normalizeTabTracks,
  validateTabSize,
  validateTabTracks,
  validateTuning,
  tabEntityToResponse,
} from "@tablab/shared";
import type { TabEntity, MeasureType } from "@tablab/shared";

const frame = (notes = 6) => ({
  id: "f",
  notes: Array.from({ length: notes }, () => ({ fret: -2, style: "none" as const })),
});

const measure = (frames = 1): MeasureType => Array.from({ length: frames }, () => frame());

const section = (measures: MeasureType[], name = "Section 1") => ({
  id: "s",
  name,
  measures,
});

describe("normalizeTabBody", () => {
  it("wraps a legacy flat measures array in one default section", () => {
    const legacy = [measure(2), measure(1)];
    const normalized = normalizeTabBody(legacy);

    expect(normalized.sections).toHaveLength(1);
    expect(normalized.sections[0].name).toBe("Section 1");
    expect(normalized.sections[0].measures).toEqual(legacy);
    expect(normalized.sections[0].id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("passes a sectioned body through untouched", () => {
    const body = { sections: [section([measure()], "Chorus")] };
    expect(normalizeTabBody(body)).toBe(body);
  });

  it("yields no sections for junk, which the route validator rejects", () => {
    expect(normalizeTabBody(null).sections).toEqual([]);
    expect(normalizeTabBody("nope").sections).toEqual([]);
    expect(normalizeTabBody(42).sections).toEqual([]);
  });
});

const GUITAR = ["E", "B", "G", "D", "A", "E"];
const BASS = ["G", "D", "A", "E"];

function entityWith(tab_data: unknown, tuning: unknown = GUITAR): TabEntity {
  return {
    id: "t1",
    user_id: "u1",
    tab_name: "Song",
    tab_artist: "Artist",
    tuning,
    tab_data,
    created_at: new Date("2026-01-01"),
    modified_at: new Date("2026-01-02"),
  } as unknown as TabEntity;
}

describe("normalizeTabTracks", () => {
  it("wraps a pre-sections measures array in one track", () => {
    const tracks = normalizeTabTracks([measure(2)]).tracks;

    expect(tracks).toHaveLength(1);
    expect(tracks[0].instrument).toBe("guitar");
    expect(tracks[0].body.sections[0].measures[0]).toHaveLength(2);
  });

  it("wraps a sectioned body in one track using the fallback tuning", () => {
    const tracks = normalizeTabTracks({ sections: [section([measure(1)])] }, BASS as any)
      .tracks;

    expect(tracks).toHaveLength(1);
    expect(tracks[0].tuning).toEqual(BASS);
    // The 0002 migration writes no octaves; they are derived from the preset on read.
    expect(tracks[0].octaves).toEqual([2, 2, 1, 1]);
  });

  it("fills in what a stored track omits", () => {
    const tracks = normalizeTabTracks({
      tracks: [{ body: { sections: [section([measure(1)])] } }],
    }).tracks;

    expect(tracks[0].id).toBeTruthy();
    expect(tracks[0].name).toBe("Track 1");
    expect(tracks[0].tuning).toEqual(GUITAR);
    expect(tracks[0].octaves).toEqual([4, 3, 3, 3, 2, 2]);
  });

  it("keeps multiple tracks and their own tunings", () => {
    const tracks = normalizeTabTracks({
      tracks: [
        { id: "a", name: "Guitar", instrument: "guitar", tuning: GUITAR, body: { sections: [section([measure(1)])] } },
        { id: "b", name: "Bass", instrument: "bass", tuning: BASS, body: { sections: [section([measure(1)])] } },
      ],
    }).tracks;

    expect(tracks.map((t) => t.name)).toEqual(["Guitar", "Bass"]);
    expect(tracks[1].tuning).toEqual(BASS);
  });
});

describe("tabEntityToResponse", () => {
  it("normalizes a legacy tab_data blob on the way out", () => {
    const response = tabEntityToResponse(entityWith([measure(2)]));

    expect(response.tracks).toHaveLength(1);
    expect(response.tracks[0].body.sections).toHaveLength(1);
    expect(response.tracks[0].body.sections[0].measures[0]).toHaveLength(2);
  });

  it("pulls the legacy tuning column onto the track", () => {
    const response = tabEntityToResponse(
      entityWith({ sections: [section([measure(1)])] }, BASS)
    );

    expect(response.tracks[0].tuning).toEqual(BASS);
    // Tuning no longer appears in details.
    expect("tuning" in response.details).toBe(false);
  });
});

describe("validateTabSize", () => {
  it("accepts a well-formed sectioned body", () => {
    const body = { sections: [section([measure(4)]), section([measure(2)], "Verse")] };
    expect(validateTabSize(body)).toEqual({ valid: true });
  });

  it("rejects a body that is not an object with sections", () => {
    expect(validateTabSize([measure()])).toMatchObject({ valid: false });
    expect(validateTabSize(null)).toMatchObject({ valid: false });
  });

  it("rejects a section without a measures array", () => {
    const result = validateTabSize({ sections: [{ id: "s", name: "x" }] });
    expect(result).toMatchObject({ valid: false });
    expect((result as { error: string }).error).toContain("Section 0");
  });

  it("counts measures across all sections against the 500 limit", () => {
    const spread = {
      sections: [section(Array(300).fill(measure())), section(Array(201).fill(measure()))],
    };
    expect(validateTabSize(spread)).toMatchObject({ valid: false });

    const underLimit = {
      sections: [section(Array(300).fill(measure())), section(Array(200).fill(measure()))],
    };
    expect(validateTabSize(underLimit)).toEqual({ valid: true });
  });

  it("caps frames per measure and names the offending section", () => {
    const result = validateTabSize({ sections: [section([measure(65)], "Solo")] });
    expect(result).toMatchObject({ valid: false });
    expect((result as { error: string }).error).toContain("section 0");
  });

  it("accepts non-6-string frames but still bounds them", () => {
    expect(validateTabSize({ sections: [section([[frame(4)]])] })).toEqual({ valid: true });
    expect(validateTabSize({ sections: [section([[frame(2)]])] })).toMatchObject({ valid: false });
    expect(validateTabSize({ sections: [section([[frame(13)]])] })).toMatchObject({ valid: false });
  });

  it("requires one note per string when given a string count", () => {
    const bass = { sections: [section([[frame(4)]])] };
    expect(validateTabSize(bass, 4)).toEqual({ valid: true });

    const mismatch = validateTabSize(bass, 6);
    expect(mismatch).toMatchObject({ valid: false });
    expect((mismatch as { error: string }).error).toContain("4 notes");
  });
});

describe("validateTabTracks", () => {
  const track = (tuning: string[], measures = [measure(1)]) => ({
    id: "t",
    name: "Track 1",
    instrument: "guitar",
    tuning,
    octaves: tuning.map(() => 3),
    body: { sections: [section(measures)] },
  });

  it("accepts a well-formed multi-track blob", () => {
    const bassTrack = {
      ...track(BASS),
      body: { sections: [section([[frame(4)]])] },
    };
    expect(validateTabTracks({ tracks: [track(GUITAR), bassTrack] })).toEqual({
      valid: true,
    });
  });

  it("rejects a blob without a tracks array", () => {
    expect(validateTabTracks({ sections: [] })).toMatchObject({ valid: false });
    expect(validateTabTracks(null)).toMatchObject({ valid: false });
  });

  it("rejects an empty tracks array", () => {
    expect(validateTabTracks({ tracks: [] })).toMatchObject({ valid: false });
  });

  it("checks each track's frames against that track's own tuning", () => {
    // A 4-string tuning with 6-note frames — the mismatch tracks are meant to prevent.
    const mismatched = { ...track(BASS) };
    const result = validateTabTracks({ tracks: [track(GUITAR), mismatched] });

    expect(result).toMatchObject({ valid: false });
    expect((result as { error: string }).error).toContain("Track 1");
  });

  it("names the offending track when its tuning is invalid", () => {
    const result = validateTabTracks({ tracks: [track(["E", "A"])] });
    expect(result).toMatchObject({ valid: false });
    expect((result as { error: string }).error).toContain("Track 0");
  });
});

describe("validateTuning", () => {
  it("accepts tunings of any supported width", () => {
    expect(validateTuning(["E", "B", "G", "D", "A", "E"])).toEqual({ valid: true });
    expect(validateTuning(["G", "D", "A", "E"])).toEqual({ valid: true });
    expect(validateTuning(["E", "B", "G", "D", "A", "E", "B"])).toEqual({ valid: true });
  });

  it("rejects non-arrays and out-of-range string counts", () => {
    expect(validateTuning("EADGBE")).toMatchObject({ valid: false });
    expect(validateTuning(["E", "A"])).toMatchObject({ valid: false });
    expect(validateTuning(Array(13).fill("E"))).toMatchObject({ valid: false });
  });

  it("rejects unknown note names", () => {
    const result = validateTuning(["E", "B", "G", "D", "A", "H"]);
    expect(result).toMatchObject({ valid: false });
    expect((result as { error: string }).error).toContain("H");
  });
});
