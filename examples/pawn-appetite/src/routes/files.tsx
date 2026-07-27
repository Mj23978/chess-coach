import { createFileRoute } from "@tanstack/react-router";
import FilesPage from "@/features/files/FilesPage";

export const Route = createFileRoute("/files")({
  component: FilesPage,
  loader: ({ context: { loadDirs } }) => loadDirs(),
});
