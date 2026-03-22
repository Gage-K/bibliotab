import { DEFAULT_TAB } from "../shared/types/consts";
import { useTabs, useCreateTab, useDeleteTab } from "../hooks/useTabs";
import type { TabType } from "../shared/types/tab.types";
import type { CreateTabPayload } from "../api/services/tabService";

import { SkeletonText } from "../components/Skeleton";
import { Button } from "../components/ui/button";
import { DataTable } from "../components/ui/data-table"
import { columns } from "../components/ui/columns"

export default function Dashboard() {
  const { data: allTabs = [], isLoading } = useTabs();
  const createTabMutation = useCreateTab();
  const deleteTabMutation = useDeleteTab();

  const isCreating = createTabMutation.isPending;

  function createTab() {
    createTabMutation.mutate(DEFAULT_TAB);
  }

  function deleteTab(id: string) {
    deleteTabMutation.mutate(id);
  }

  function duplicateTab(tab: TabType) {
    const payload: CreateTabPayload = {
      tab_name: `${tab.details.song} (Copy)`,
      tab_artist: tab.details.artist,
      tuning: [...tab.details.tuning],
      tab_data: tab.body,
    };
    createTabMutation.mutate(payload);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tabs</h1>
          <p className="text-sm text-muted-foreground">
            Manage and edit your guitar tabs.
          </p>
        </div>
        {allTabs.length > 0 && (
          <Button onClick={createTab} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create New Tab"}
          </Button>
        )}
      </div>
      {isLoading ? (
        <>
          <SkeletonText />
          <SkeletonText />
        </>
      ) : allTabs.length === 0 ? (
        <button
          onClick={createTab}
          disabled={isCreating}
          className="w-full rounded-lg py-12 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
          <span className="text-lg font-medium">
            {isCreating ? "Creating..." : "+ Create New Tab"}
          </span>
        </button>
      ) : (
        <DataTable columns={columns} data={allTabs} meta={{ deleteTab, duplicateTab }} />
      )}
    </>
  );
}
