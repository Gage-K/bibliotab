import { Outlet } from "react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function SidebarLayout() {
  return (
    <SidebarProvider
      className="flex flex-col"
      style={{ "--header-height": "3rem" } as React.CSSProperties}
    >
      <SiteHeader />
      <div className="flex flex-1">
        <AppSidebar />
        <SidebarInset>
          <div className="mx-auto px-4 py-6 w-full max-w-5xl h-full">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
