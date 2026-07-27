import { createFileRoute } from "@tanstack/react-router";
import BoardsPage from "@/features/boards/BoardsPage";

export const Route = createFileRoute("/boards")({
  component: BoardsPage,
  loader: ({ context: { loadDirs } }) => loadDirs(),
});
