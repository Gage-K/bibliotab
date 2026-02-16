import { Link } from "react-router";
import { DEFAULT_TAB } from "../shared/types/consts";
import { useTabs, useCreateTab, useDeleteTab } from "../hooks/useTabs";

import { SkeletonText } from "../components/Skeleton";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function Dashboard() {
  const { data: allTabs = [], isLoading } = useTabs();
  const createTabMutation = useCreateTab();
  const deleteTabMutation = useDeleteTab();

  const isCreating = createTabMutation.isPending;
  const isDeletingId = deleteTabMutation.isPending ? deleteTabMutation.variables : null;

  function createTab() {
    createTabMutation.mutate(DEFAULT_TAB);
  }

  function deleteTab(id: string) {
    deleteTabMutation.mutate(id);
  }

  return (
    <div className="grid gap-6">
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Artist</TableHead>
              <TableHead>Tuning</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allTabs.map((tab) => (
              <TableRow key={tab.id}>
                <TableCell>{tab.details.song}</TableCell>
                <TableCell>{tab.details.artist}</TableCell>
                <TableCell>{[...tab.details.tuning].reverse().join("")}</TableCell>
                <TableCell className="flex gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <Link to={`/editor/${tab.id}`} viewTransition>
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isDeletingId === tab.id}
                    onClick={() => deleteTab(tab.id)}>
                    {isDeletingId === tab.id ? "Deleting" : "Delete"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
