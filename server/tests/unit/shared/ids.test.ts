import { afterEach, describe, expect, it, vi } from "vitest";
import { newId } from "../../../../shared/utils/ids";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("newId", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a v4 UUID", () => {
    expect(newId()).toMatch(UUID_V4);
  });

  it("builds a v4 UUID from getRandomValues outside a secure context", () => {
    // A browser on plain http (a dev server opened over a LAN IP) has no randomUUID.
    const { getRandomValues } = globalThis.crypto;
    vi.stubGlobal("crypto", {
      getRandomValues: getRandomValues.bind(globalThis.crypto),
    });

    const ids = new Set(Array.from({ length: 50 }, () => newId()));
    for (const id of ids) expect(id).toMatch(UUID_V4);
    expect(ids.size).toBe(50);
  });
});
