import { Sidebar } from "@phosphor-icons/react"
import { Link, useLocation, useParams } from "react-router"

import { useTab } from "../hooks/useTabs"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/profile": "Profile",
}

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const location = useLocation()
  const { tabId } = useParams()
  const { data: tab } = useTab(tabId ?? "", { enabled: !!tabId })

  const pageTitle = PAGE_TITLES[location.pathname]
  const isEditor = !!tabId
  const editorTitle = tab?.details.song || "Untitled"

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <Sidebar />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            {isEditor ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{editorTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : pageTitle ? (
              <BreadcrumbItem>
                <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            ) : null}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
