import { ColumnDef } from "@tanstack/react-table"
import { TabType } from "../../shared/types/tab.types"
import { Link } from "react-router"
import { Button } from "./button"
import { DotsThree, ArrowUp, ArrowDown } from "@phosphor-icons/react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

function timeAgo(date: Date): string {
  const now = Date.now();
  const seconds = Math.round((now - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  if (seconds < 60) return rtf.format(-seconds, "second");
  if (minutes < 60) return rtf.format(-minutes, "minute");
  if (hours < 24) return rtf.format(-hours, "hour");
  if (days < 7) return rtf.format(-days, "day");

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const columns: ColumnDef<TabType>[] = [
  {
    id: "title",
    accessorFn: (row) => row.details.song,
    header: ({ column }) => {
      const sorted = column.getIsSorted()
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >Title {sorted === "asc" ? <ArrowUp className="ml-1 h-1 w-1 text-muted-foreground" /> : sorted === "desc" ? <ArrowDown className="ml-1 h-1 w-1 text-muted-foreground" /> : null}</Button>
      )
    }
  },
  {
    id: "artist",
    accessorFn: (row) => row.details.artist,
    header: ({ column }) => {
      const sorted = column.getIsSorted()
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >Artist{sorted === "asc" ? <ArrowUp className="ml-1 h-1 w-1 text-muted-foreground" /> : sorted === "desc" ? <ArrowDown className="ml-1 h-1 w-1 text-muted-foreground" /> : null}</Button>
      )
    }
  },
  {
    id: "tuning",
    accessorFn: (row) => [...row.details.tuning].reverse().join(""),
    header: "Tuning",
  },
  {
    id: "dateModified",
    accessorFn: (row) => row.details.dateModified,
    header: ({ column }) => {
      const sorted = column.getIsSorted()

      return (
        < Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")
        }
        >Last modified{sorted === "asc" ? <ArrowUp className="ml-1 h-1 w-1 text-muted-foreground" /> : sorted === "desc" ? <ArrowDown className="ml-1 h-1 w-1 text-muted-foreground" /> : null}</Button >

      )
    },
    cell: ({ getValue }) => timeAgo(new Date(getValue() as string)),
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const tab = row.original
      const meta = table.options.meta as {
        deleteTab?: (id: string) => void
        duplicateTab?: (tab: TabType) => void
      } | undefined

      return (
        <>
          <Button asChild variant="secondary" size="sm">
            <Link to={`/editor/${tab.id}`} viewTransition>
              Edit
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">
                <span className="sr-only">Open menu</span>
                <DotsThree className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="sr-only">Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`${window.location.origin}/editor/${tab.id}`)}>
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => meta?.duplicateTab?.(tab)}>
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => meta?.deleteTab?.(tab.id)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )
    }
  },
]
