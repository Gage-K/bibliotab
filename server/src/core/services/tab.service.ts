import { TabRepository } from "../../data/repositories/tab.repository";
import { ForbiddenError, NotFoundError } from "../../common/errors/AppError";
import { CreateTabDto, Tab, UpdateTabDto } from "../types/tab.types";

export class TabService {
  constructor(private tabRepo: TabRepository) {}

  async getTab(tabId: string, userId: string): Promise<Tab | null> {
    const tab = await this.tabRepo.findById(tabId);
    if (!tab) {
      throw new NotFoundError("Tab");
    }

    await this.verifyOwnership(tabId, userId);

    return tab;
  }

  async getUserTabs(userId: string): Promise<Tab[]> {
    return this.tabRepo.findByUserId(userId);
  }

  async createTab(tabData: CreateTabDto, userId: string): Promise<Tab> {
    return this.tabRepo.create(userId, tabData);
  }

  async updateTab(
    tabId: string,
    tabData: UpdateTabDto,
    userId: string
  ): Promise<Tab | null> {
    await this.verifyOwnership(tabId, userId);

    const updatedTab = await this.tabRepo.update(tabId, tabData);
    if (!updatedTab) {
      throw new NotFoundError("Tab not found.");
    }

    return updatedTab;
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
