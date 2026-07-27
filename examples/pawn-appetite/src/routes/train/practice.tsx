import { createFileRoute } from "@tanstack/react-router";
import PracticePage from "@/features/train/PracticePage";

export const Route = createFileRoute("/train/practice")({
  component: PracticePage,
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search.category === "string" ? search.category : undefined,
  }),
});
