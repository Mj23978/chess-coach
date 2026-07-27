"use client"

import { cn } from "@repo/ui/lib/utils"
import {
  Bot,
  Clock,
  FileText,
  FolderOpen,
  Layers,
  Mic,
  Sparkles,
  Video
} from "lucide-react"
import { ReactElement, useState } from "react"
import { AppSidebar } from "./app-sidebar"

interface ProjectLayoutProps {
  children: ReactElement
  projectId: string
  projectName?: string
  projectStatus?: "draft" | "processing" | "completed" | "failed"
  projectProgress?: number
  className?: string
}

export function ProjectLayout({
  children,
  projectId,
  projectName,
  projectStatus,
  projectProgress,
  className
}: ProjectLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Subtle gradient mesh */}
        <div className="absolute top-0 right-0 w-150 h-150 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-125 h-125 bg-blue-500/5 rounded-full blur-[100px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px"
          }}
        />
      </div>

      {/* Sidebar */}
      <AppSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        backLink={{ label: "Projects", href: "/projects" }}
        contextCard={{
          title: projectName || "Untitled Project",
          subtitle: projectStatus,
          // icon: getStatusIcon(projectStatus), // Optional: Helper to return CheckCircle/Alert/Spinner
          progress: projectProgress,
          settingsHref: `/projects/${projectId}/settings`
        }}
        sections={[
          {
            title: "Manage",
            items: [
              { id: "overview", label: "Overview", icon: Layers, href: `/projects/${projectId}/`, description: "Project dashboard" },
              { id: "cast", label: "Cast & Voices", icon: Mic, href: `/projects/${projectId}/cast`, description: "Manage characters and voices" },
              { id: "assets", label: "Assets", icon: FolderOpen, href: `/projects/${projectId}/assets`, description: "Project media library" },
            ]
          },
          {
            title: "Create",
            items: [
              { id: "creative", label: "Creative", icon: Sparkles, href: `/projects/${projectId}/creative`, description: "Ideas and scripts", badge: "new" },
              { id: "agents", label: "Agents", icon: Bot, href: `/projects/${projectId}/agents`, description: "Project AI agents", badge: "new" },
              { id: "workflows", label: "Workflows", icon: Video, href: `/projects/${projectId}/workflows`, description: "Video generation pipelines" },
              { id: "hyperframes", label: "Hyperframes", icon: FileText, href: `/projects/${projectId}/hyperframes`, description: "Dynamic templates" },
            ]
          },
          {
            title: "Organize",
            items: [
              { id: "scheduler", label: "Scheduler", icon: Clock, href: `/projects/${projectId}/scheduler`, description: "Automated publishing" },
            ]
          }
        ]
        }
      />

      <main
        className={cn(
          "relative z-10 flex-1 min-h-0 overflow-y-auto transition-all duration-300 ease-out",
          collapsed ? "ml-20" : "ml-70"
        )}
      >
        {/* When a page passes its own `className` (e.g. the chat route needs
            a bounded-height, non-scrolling full-bleed container so the
            internal StickToBottom conversation can manage its own scroll),
            honor it verbatim instead of forcing `min-h-screen`, which would
            otherwise make the wrapper taller than `<main>` and push scrolling
            out to `<main>` instead of the conversation. */}
        <div className={className ?? "min-h-screen"}>
          {children}
        </div>
      </main>
    </div>
  )
}
