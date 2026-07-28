/**
 * Clock — displays remaining time for one side, `mm:ss` (or `h:mm:ss` past an
 * hour). Turns red under 30s (low-time pressure) and greyed when it's not this
 * side's turn. `ms` is milliseconds remaining, straight from the session's
 * server-authoritative clock.
 */
import { cn } from "@repo/ui/lib/utils";

export interface ClockProps {
  /** Remaining time in milliseconds. */
  ms: number | null;
  /** Whether it's this side's turn (drives the active highlight). */
  active: boolean;
  className?: string;
}

export function Clock({ ms, active, className }: ClockProps) {
  if (ms == null) {
    // Untimed game — render an unobtrusive dash so the layout stays even.
    return (
      <span className={cn("font-mono text-sm text-muted-foreground", className)}>—</span>
    );
  }
  const low = ms <= 30_000;
  return (
    <span
      className={cn(
        "font-mono text-sm tabular-nums",
        active ? "text-foreground" : "text-muted-foreground",
        low && active && "text-destructive",
        className,
      )}
    >
      {formatDuration(ms)}
    </span>
  );
}

/** Format ms as `mm:ss`, or `h:mm:ss` once ≥ 1 hour. Clamps at 0. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}
