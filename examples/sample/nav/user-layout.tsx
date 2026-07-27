"use client"

import { Bot, CalendarClock, CreditCard, FolderKanban, HardDrive, LayoutDashboard, Settings, Sparkles, User, Wrench, Workflow } from "lucide-react"
import { ReactElement, useState } from "react"
import { AppSidebar, NavSection } from "./app-sidebar"
import { cn } from "@repo/ui/lib/utils"

interface UserLayoutProps {
  children: ReactElement
  sidebarContent?: ReactElement
  footerContent?: ReactElement
  className?: string
}

const USER_NAV_SECTIONS: NavSection[] = [
  {
    title: "Platform",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { id: "projects", label: "Projects", icon: FolderKanban, href: "/projects" },
      { id: "assets", label: "Asset Library", icon: HardDrive, href: "/assets" },
    ]
  },
  {
    title: "Studio",
    items: [
      { id: "agents", label: "Agents", icon: Bot, href: "/agents" },
      { id: "agent-builder", label: "Agent Builder", icon: Wrench, href: "/agent-builder" },
      { id: "workflows", label: "Workflows", icon: Workflow, href: "/workflows" },
      { id: "schedules", label: "Schedules", icon: CalendarClock, href: "/schedules" },
    ]
  },
  {
    title: "Account",
    items: [
      { id: "profile", label: "Profile", icon: User, href: "/profile" },
      { id: "billing", label: "Billing", icon: CreditCard, href: "/billing" },
      { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
    ]
  }
]


export function UserLayout({
  children,
  sidebarContent,
  footerContent,
  className
}: UserLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    // Height-bounded flex column so `<main>` becomes the page's scroll
    // container. Previously this was `min-h-screen` with a bare `<main>` and
    // no overflow rule, so scrolling fell through to `document`/`#root` —
    // which clipped tall content (e.g. the agents "Code Agents" tab) with no
    // scrollbar. `h-screen overflow-hidden` bounds the height; `flex-1
    // min-h-0 overflow-y-auto` on `<main>` makes it scroll. `min-h-0` is
    // mandatory: without it the flex child won't shrink below its content and
    // scroll never engages. The sidebar is `position:fixed`, so it's unaffected.
    <div className="flex h-screen w-full flex-col overflow-hidden">
      {/* Sidebar */}
      <AppSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        brand={{ name: "VidCraft AI", icon: <Sparkles className="h-4 w-4" />, href: "/dashboard" }}
        sections={USER_NAV_SECTIONS}
        sidebarContent={sidebarContent}
        footerContent={footerContent}
      />

      {/* Main Content — the page scroll container */}
      <main
        className={cn(
          "relative z-10 flex-1 min-h-0 overflow-y-auto transition-all duration-300 ease-out",
          collapsed ? "ml-20" : "ml-70"
        )}
      >
        <div className={cn(className)}>
          {children}
        </div>
      </main>
    </div>
  )
}
