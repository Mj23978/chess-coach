import { createFileRoute } from "@tanstack/react-router";
import KeyboardShortcutsPage from "@/features/settings/KeyboardShortcutsPage";

export const Route = createFileRoute("/settings/keyboard-shortcuts")({
  component: KeyboardShortcutsPage,
});
