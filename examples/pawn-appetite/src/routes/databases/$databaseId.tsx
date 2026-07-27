import { createFileRoute } from "@tanstack/react-router";
import DatabaseView from "@/features/databases/DatabaseView";

export const Route = createFileRoute("/databases/$databaseId")({
  component: DatabaseView,
});
