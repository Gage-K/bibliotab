import { TabRepository } from "../../data/repositories/tab.repository";
import { ForbiddenError, NotFoundError } from "../../common/errors/AppError";
import { CreateTabDto, TabResponse, UpdateTabDto } from "../types/tab.types";
import { tabEntityToResponse, tabEntitiesToResponses } from "@tablab/shared";

export class TabService {
  constructor(private tabRepo: TabRepository) {}

  async getTab(tabId: string, userId: string): Promise<TabResponse> {
    const tab = await this.tabRepo.findById(tabId);
    if (!tab) {
      throw new NotFoundError("Tab");
    }

    await this.verifyOwnership(tabId, userId);

    return tabEntityToResponse(tab);
  }

  async getUserTabs(userId: string): Promise<TabResponse[]> {
    const tabs = await this.tabRepo.findByUserId(userId);
    return tabEntitiesToResponses(tabs);
  }

  async getUserTabsPaginated(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const result = await this.tabRepo.findByUserIdPaginated(userId, page, limit);
    return {
      tabs: tabEntitiesToResponses(result.tabs),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async createTab(tabData: CreateTabDto, userId: string): Promise<TabResponse> {
    const created = await this.tabRepo.create(userId, tabData);
    return tabEntityToResponse(created);
  }

  async updateTab(
    tabId: string,
    tabData: UpdateTabDto,
    userId: string
  ): Promise<TabResponse> {
    await this.verifyOwnership(tabId, userId);

    const updatedTab = await this.tabRepo.update(tabId, tabData);
    if (!updatedTab) {
      throw new NotFoundError("Tab");
    }

    return tabEntityToResponse(updatedTab);
  }

  async deleteTab(tabId: string, userId: string): Promise<boolean> {
    await this.verifyOwnership(tabId, userId);
    return this.tabRepo.delete(tabId);
  }

  async verifyOwnership(tabId: string, requesterId: string): Promise<void> {
    const tab = await this.tabRepo.findById(tabId);
    const owner = tab?.user_id;
    if (owner !== requesterId) {
      throw new ForbiddenError("You do not have access to this tab.");
    }
  }
}
