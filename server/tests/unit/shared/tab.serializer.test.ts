import { describe, it, expect } from "vitest";
// Imported by relative path rather than the "@tablab/shared" alias, which vitest
// does not resolve (see tests/unit/services/tab.service.test.ts).
import {
  normalizeTabBody,
  validateTabSize,
  tabEntityToResponse,
} from "../../../../shared/utils/tab.serializer";
import type { TabEntity, MeasureType } from "../../../../shared/types/tab.types";

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

describe("tabEntityToResponse", () => {
  it("normalizes a legacy tab_data blob on the way out", () => {
    const entity = {
      id: "t1",
      user_id: "u1",
      tab_name: "Song",
      tab_artist: "Artist",
      tuning: ["E", "B", "G", "D", "A", "E"],
      tab_data: [measure(2)],
      created_at: new Date("2026-01-01"),
      modified_at: new Date("2026-01-02"),
    } as unknown as TabEntity;

    const response = tabEntityToResponse(entity);
    expect(response.body.sections).toHaveLength(1);
    expect(response.body.sections[0].measures[0]).toHaveLength(2);
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
    expect(validateTabSize({ sections: [section([[frame(0)]])] })).toMatchObject({ valid: false });
    expect(validateTabSize({ sections: [section([[frame(13)]])] })).toMatchObject({ valid: false });
  });
});
