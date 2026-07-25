/**
 * NewTabModal — the "new tab" picker shown when the user hits the + button.
 *
 * Four cards (browser-tab-like chrome). Play Game and Enter FEN are
 * functional; Analysis and Import (PGN) are deferred (Phase 3 follow-up /
 * already covered by the dashboard import modal) and shown disabled with a
 * "Coming soon" tag.
 */
import { Dices, FileText, PencilRuler, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { cn } from "@repo/ui/lib/utils";

export type NewTabKind = "play" | "fen";

export interface NewTabModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the user picks a functional card. */
  onPick: (kind: NewTabKind, opts?: { fen?: string }) => void;
}

export function NewTabModal({ open, onOpenChange, onPick }: NewTabModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New tab</DialogTitle>
          <DialogDescription>
            Pick what to open in a new board tab.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Card
            icon={<Dices className="size-5" />}
            title="Play Game"
            description="Start a new game against a human or the engine."
            onClick={() => {
              onPick("play");
              onOpenChange(false);
            }}
          />
          <Card
            icon={<FileText className="size-5" />}
            title="Enter FEN"
            description="Load a custom position to play or analyze from."
            onClick={() => {
              onPick("fen");
              onOpenChange(false);
            }}
          />
          <Card
            icon={<Search className="size-5" />}
            title="Analysis"
            description="Analyze a position with the engine."
            disabled
            badge="Coming soon"
          />
          <Card
            icon={<PencilRuler className="size-5" />}
            title="Import PGN"
            description="Paste a game to review move-by-move."
            disabled
            badge="Use Import"
            onClick={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
}

function Card({ icon, title, description, onClick, disabled, badge }: CardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex flex-col items-start gap-2 rounded-lg border border-neutral-200 p-4 text-left transition-colors",
        disabled
          ? "cursor-not-allowed bg-neutral-50 opacity-60"
          : "hover:border-blue-300 hover:bg-blue-50/40",
      )}
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-neutral-700">{icon}</span>
        {badge && (
          <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-600">
            {badge}
          </span>
        )}
      </div>
      <div>
        <div className="text-sm font-semibold text-neutral-900">{title}</div>
        <div className="text-xs text-neutral-500">{description}</div>
      </div>
    </button>
  );
}
