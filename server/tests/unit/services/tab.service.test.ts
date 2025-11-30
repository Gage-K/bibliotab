import { describe, it, expect, beforeEach, vi } from "vitest";
import { TabService } from "../../../src/core/services/tab.service";
import { TabRepository } from "../../../src/data/repositories/tab.repository";
import { Tab, TabTuning } from "../../../src/core/types/tab.types";

describe("TabService", () => {
  let tabService: TabService;
  let mockTabRepository: TabRepository;

  const mockTab = {
    id: "tab-123",
    user_id: "user-123",
    tab_name: "Test tab",
    tab_artist: "Test artist",
    tuning: ["E", "B", "G", "D", "A", "E"] as TabTuning,
    created_at: new Date(),
    modified_at: new Date(),
    tab: JSON.stringify([
      [
        {
          id: 1,
          notes: [
            {
              fret: 0,
              style: "none",
            },
          ],
        },
      ],
      [
        {
          id: 2,
          notes: [
            {
              fret: 0,
              style: "none",
            },
          ],
        },
      ],
    ]),
  };

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
    it("should get a tab by id", async () => {
      vi.mocked(mockTabRepository.findById).mockResolvedValue(mockTab);

      const result = await tabService.getTab(mockTab.id, mockTab.user_id);

      expect(result).toEqual(mockTab);
      expect(mockTabRepository.findById).toHaveBeenCalledWith(mockTab.id);
    });

    it("should throw an error if the tab is not found", async () => {
      vi.mocked(mockTabRepository.findById).mockResolvedValue(null);
      try {
        await tabService.getTab("invalid-tab-id", mockTab.user_id);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toBe("Tab not found");
        expect(error.statusCode).toBe(404);
      }
    });
  });
});
