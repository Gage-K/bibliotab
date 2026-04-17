import { Link, useParams, useNavigate } from "react-router"
import {
  MusicNote,
  SquaresFour,
  SignOut,
  MusicNotes,
  Plus,
  User,
} from "@phosphor-icons/react"

import { ModeToggle } from "./theme-switcher"
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
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!" variant="inset"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="bg-blue text-blue-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <MusicNotes className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">bibliotab</span>
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
                    <SquaresFour />
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
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={handleCreateTab}
                      disabled={createTabMutation.isPending} className="cursor-pointer"
                    >
                      <Plus />
                      <span>{createTabMutation.isPending ? "Creating..." : "New Tab"}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {allTabs.slice(0, 10).map((tab) => (
                    <SidebarMenuItem key={tab.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={tab.id === tabId}
                        tooltip={`${tab.details.song} - ${tab.details.artist}`}
                      >
                        <Link to={`/editor/${tab.id}`}>
                          <MusicNote />
                          <span>{tab.details.song || "Untitled"}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ModeToggle />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <SignOut />
              <span>Log out{auth.user ? ` (${auth.user})` : ""}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
