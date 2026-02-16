import { Link, useParams, useNavigate } from "react-router"
import {
  FileMusic,
  LayoutDashboard,
  LogOut,
  Music,
  Plus,
  User,
} from "lucide-react"

import { useTabs, useCreateTab } from "../hooks/useTabs"
import useTypedAuth from "../hooks/useTypedAuth"
import { DEFAULT_TAB } from "../shared/types/consts"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { tabId } = useParams()
  const navigate = useNavigate()
  const { auth, setAuth } = useTypedAuth()
  const { data: allTabs = [], isLoading } = useTabs()
  const createTabMutation = useCreateTab()

  function handleCreateTab() {
    createTabMutation.mutate(DEFAULT_TAB)
  }

  function handleLogout() {
    setAuth({})
    navigate("/")
  }

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Music className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">tablab</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation links */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard />
                    <span>All tabs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/profile">
                    <User />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User's tabs */}
        <SidebarGroup>
          <SidebarGroupLabel>Recent tabs</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton />
                  </SidebarMenuItem>
                ))
              ) : (
                <>
                  {allTabs.map((tab) => (
                    <SidebarMenuItem key={tab.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={tab.id === tabId}
                        tooltip={`${tab.details.song} - ${tab.details.artist}`}
                      >
                        <Link to={`/editor/${tab.id}`}>
                          <FileMusic />
                          <span>{tab.details.song || "Untitled"}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={handleCreateTab}
                      disabled={createTabMutation.isPending}
                    >
                      <Plus />
                      <span>{createTabMutation.isPending ? "Creating..." : "New Tab"}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut />
              <span>Log out{auth.user ? ` (${auth.user})` : ""}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
