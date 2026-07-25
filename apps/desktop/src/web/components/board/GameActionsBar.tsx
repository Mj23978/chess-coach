/**
 * GameActionsBar — the row of game controls under/above the board.
 *
 * Flip board orientation, resign, and save (download PGN). Screenshot is
 * deferred (needs tray/clipboard wiring); Reload (restart with same setup) is
 * surfaced as a no-op placeholder when a game is finished.
 */
import { Download, FlipHorizontal2, Flag, RotateCcw } from "lucide-react";
import { Button } from "@repo/ui/components/button";

export interface GameActionsBarProps {
  onFlip: () => void;
  onResign?: () => void;
  onSave?: () => void;
  onReload?: () => void;
  /** Disable resign/move actions after the game ends. */
  finished?: boolean;
  className?: string;
}

export function GameActionsBar({
  onFlip,
  onResign,
  onSave,
  onReload,
  finished,
  className,
}: GameActionsBarProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={onFlip}
        title="Flip board (F)"
      >
        <FlipHorizontal2 className="size-4" />
        <span className="sr-only">Flip</span>
      </Button>
      {onResign && (
        <Button
          variant="outline"
          size="sm"
          onClick={onResign}
          disabled={finished}
          title="Resign"
        >
          <Flag className="size-4" />
          <span className="sr-only">Resign</span>
        </Button>
      )}
      {onSave && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={finished}
          title="Save PGN"
        >
          <Download className="size-4" />
          <span className="sr-only">Save</span>
        </Button>
      )}
      {onReload && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReload}
          title="New game (same setup)"
        >
          <RotateCcw className="size-4" />
          <span className="sr-only">Reload</span>
        </Button>
      )}
    </div>
  );
}
