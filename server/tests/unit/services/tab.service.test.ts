import { describe, it, expect, beforeEach, vi } from "vitest";
import { TabService } from "../../../src/core/services/tab.service";
import { TabRepository } from "../../../src/data/repositories/tab.repository";
import { TabEntity, TuningType } from "../../../src/core/types/tab.types";

const TUNING = ["E", "B", "G", "D", "A", "E"] as TuningType;

function makeFrame(id: string) {
  return { id, notes: [{ fret: 0, style: "none" as const }] };
}

function makeEntity(overrides: Partial<TabEntity> = {}): TabEntity {
  return {
    id: "tab-123",
    user_id: "user-123",
    tab_name: "Test tab",
    tab_artist: "Test artist",
    tuning: TUNING,
    created_at: new Date("2024-01-01T00:00:00.000Z"),
    modified_at: new Date("2024-01-02T00:00:00.000Z"),
    bpm: 90,
    time_signature: [4, 4] as [number, number],
    tab_data: {
      tracks: [
        {
          id: "track-1",
          name: "Track 1",
          instrument: "guitar",
          tuning: TUNING,
          octaves: [4, 3, 3, 3, 2, 2],
          body: {
            sections: [
              { id: "section-1", name: "Intro", measures: [[makeFrame("f1")]] },
            ],
          },
        },
      ],
    },
    ...overrides,
  };
}

describe("TabService", () => {
  let tabService: TabService;
  let mockTabRepository: TabRepository;

  beforeEach(() => {
    mockTabRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as any;

    tabService = new TabService(mockTabRepository);

    vi.clearAllMocks();
  });

  describe("Get tab", () => {
    it("should map an entity to the response shape", async () => {
      const entity = makeEntity();
      vi.mocked(mockTabRepository.findById).mockResolvedValue(entity);

      const result = await tabService.getTab(entity.id, entity.user_id);

      expect(result).toEqual({
        id: entity.id,
        details: {
          song: entity.tab_name,
          artist: entity.tab_artist,
          creator: entity.user_id,
          dateCreated: entity.created_at.toISOString(),
          dateModified: entity.modified_at.toISOString(),
          bpm: 90,
          timeSignature: [4, 4],
        },
        tracks: entity.tab_data.tracks,
      });
      expect(mockTabRepository.findById).toHaveBeenCalledWith(entity.id);
    });

    it("should wrap a legacy flat tab_data array in one default track", async () => {
      // Rows written before the 0001 sections migration store a bare measures array.
      const legacy = makeEntity({
        tab_data: [[makeFrame("f1")], [makeFrame("f2")]] as any,
      });
      vi.mocked(mockTabRepository.findById).mockResolvedValue(legacy);

      const result = await tabService.getTab(legacy.id, legacy.user_id);

      expect(result.tracks).toHaveLength(1);
      const body = result.tracks[0].body;
      expect(body.sections).toHaveLength(1);
      expect(body.sections[0].name).toBe("Section 1");
      expect(body.sections[0].measures).toEqual([[makeFrame("f1")], [makeFrame("f2")]]);
    });

    it("should pull the legacy tuning column onto the wrapped track", async () => {
      // Rows written before the 0002 tracks migration keep their tuning in a column.
      const preTracks = makeEntity({
        tab_data: {
          sections: [{ id: "s", name: "Intro", measures: [[makeFrame("f1")]] }],
        } as any,
      });
      vi.mocked(mockTabRepository.findById).mockResolvedValue(preTracks);

      const result = await tabService.getTab(preTracks.id, preTracks.user_id);

      expect(result.tracks[0].tuning).toEqual(TUNING);
      expect(result.tracks[0].octaves).toEqual([4, 3, 3, 3, 2, 2]);
    });

    it("should throw an error if the tab is not found", async () => {
      vi.mocked(mockTabRepository.findById).mockResolvedValue(null);
      try {
        await tabService.getTab("invalid-tab-id", "user-123");
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toBe("Tab not found");
        expect(error.statusCode).toBe(404);
      }
    });
  });

  describe("Create tab", () => {
    it("should normalize a legacy body into tracks before persisting it", async () => {
      const created = makeEntity();
      vi.mocked(mockTabRepository.create).mockResolvedValue(created);

      await tabService.createTab(
        {
          tab_name: "Test tab",
          tab_artist: "Test artist",
          tuning: TUNING,
          tab_data: [[makeFrame("f1")]] as any,
        },
        "user-123"
      );

      const persisted = vi.mocked(mockTabRepository.create).mock.calls[0][1];
      expect(persisted.tab_data.tracks).toHaveLength(1);
      expect(persisted.tab_data.tracks[0].body.sections[0].measures).toEqual([
        [makeFrame("f1")],
      ]);
    });

    it("should mirror track 0's tuning into the vestigial tuning column", async () => {
      const created = makeEntity();
      vi.mocked(mockTabRepository.create).mockResolvedValue(created);

      const bass = ["G", "D", "A", "E"] as TuningType;
      await tabService.createTab(
        {
          tab_name: "Bass line",
          tab_artist: "Test artist",
          tuning: TUNING,
          tab_data: {
            tracks: [
              {
                id: "t",
                name: "Bass",
                instrument: "bass",
                tuning: bass,
                octaves: [2, 2, 1, 1],
                body: { sections: [{ id: "s", name: "Intro", measures: [[makeFrame("f1")]] }] },
              },
            ],
          },
        },
        "user-123"
      );

      const persisted = vi.mocked(mockTabRepository.create).mock.calls[0][1];
      expect(persisted.tuning).toEqual(bass);
    });
  });

  describe("Update tab", () => {
    it("should leave tab_data absent when the update omits it", async () => {
      const entity = makeEntity();
      vi.mocked(mockTabRepository.findById).mockResolvedValue(entity);
      vi.mocked(mockTabRepository.update).mockResolvedValue(entity);

      await tabService.updateTab(entity.id, { tab_name: "Renamed" }, entity.user_id);

      const patch = vi.mocked(mockTabRepository.update).mock.calls[0][1];
      expect(patch).toEqual({ tab_name: "Renamed" });
      expect("tab_data" in patch).toBe(false);
    });
  });
});
