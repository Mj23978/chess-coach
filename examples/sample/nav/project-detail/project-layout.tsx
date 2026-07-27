"use client";

import { useParams } from "next/navigation";
import { useProject } from "@/domains/projects/hooks/use-projects";
import { ProjectLayout } from "@/domains/common/nav/project-layout";

export function ProjectDetailLayout({
  children,
  className,
}: {
  children: React.ReactElement;
  className?: string;
}) {
  const params = useParams();
  const projectId = params.projectId as string;

  const { project, isPending } = useProject(projectId);

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-center">
          <div className="h-8 w-8 border-4 border-primary border-r-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <ProjectLayout
      projectId={projectId}
      projectName={project.name}
      projectStatus={project.status as "draft" | "processing" | "completed" | "failed"}
      projectProgress={0}
      className={className}
    >
      {children}
    </ProjectLayout>
  );
}
