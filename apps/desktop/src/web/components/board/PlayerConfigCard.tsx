/**
 * PlayerConfigCard — one side of the play setup.
 *
 * Renders a player's identity (Human/Engine toggle, name input, time control
 * when human, engine dropdown when engine) and, once a game has started, the
 * same card becomes a read-only player header that shows the live clock.
 *
 * Used twice in PlayGameView (white + black). The two `PlayerConfig` objects
 * it edits are the source of truth for the "Start game" body.
 */
import { useQuery } from "@tanstack/react-query";
import { Clock } from "./Clock";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { ToggleGroup, ToggleGroupItem } from "@repo/ui/components/toggle-group";
import { fetchEngines } from "../../lib/api";
import type { PlayerSpec, TimeControl, PlayerColor } from "../../lib/play-api";
import { cn } from "@repo/ui/lib/utils";

export interface PlayerConfig {
  kind: "human" | "engine";
  name: string;
  engineId?: string;
}

/** Preset time controls for the dropdown (minutes / increment seconds). */
export const TIME_CONTROLS: { label: string; value: TimeControl }[] = [
  { label: "Untimed", value: { minutes: 0, increment: 0 } },
  { label: "Bullet 1+0", value: { minutes: 1, increment: 0 } },
  { label: "Bullet 2+1", value: { minutes: 2, increment: 1 } },
  { label: "Blitz 3+0", value: { minutes: 3, increment: 0 } },
  { label: "Blitz 3+2", value: { minutes: 3, increment: 2 } },
  { label: "Blitz 5+0", value: { minutes: 5, increment: 0 } },
  { label: "Rapid 10+0", value: { minutes: 10, increment: 0 } },
  { label: "Rapid 15+10", value: { minutes: 15, increment: 10 } },
  { label: "Classical 30+0", value: { minutes: 30, increment: 0 } },
];

export interface PlayerConfigCardProps {
  color: PlayerColor;
  config: PlayerConfig;
  onChange: (next: PlayerConfig) => void;
  /** Time control for this player (shared display; both sides share one TC). */
  timeControl?: TimeControl;
  onTimeControlChange?: (tc: TimeControl) => void;
  /** Show the time-control selector (only render on ONE of the two cards). */
  showTimeControl?: boolean;
  /** When a game is live: read-only header mode. */
  live?: {
    msRemaining: number | null;
    active: boolean;
  };
  className?: string;
}

const PIECE_GLYPH: Record<PlayerColor, string> = { white: "♔", black: "♚" };

export function PlayerConfigCard({
  color,
  config,
  onChange,
  timeControl,
  onTimeControlChange,
  showTimeControl = false,
  live,
  className,
}: PlayerConfigCardProps) {
  // Fetch configured engines once for the engine dropdown.
  const { data: engines } = useQuery({
    queryKey: ["engines"],
    queryFn: fetchEngines,
  });

  const isWhite = color === "white";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border px-3 py-2",
        isWhite ? "bg-background" : "bg-muted/50",
        className,
      )}
    >
      <div className="flex w-16 shrink-0 items-center gap-1.5">
        <span className="text-lg leading-none">{PIECE_GLYPH[color]}</span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {color}
        </span>
      </div>

      {/* Live mode: just name + clock, read-only. */}
      {live ? (
        <>
          <span className="flex-1 truncate text-sm font-medium text-foreground">
            {config.name}
          </span>
          <Clock ms={live.msRemaining} active={live.active} />
        </>
      ) : (
        <>
          {/* Human / Engine toggle */}
          <ToggleGroup
            type="single"
            value={config.kind}
            onValueChange={(v) => {
              if (v !== "human" && v !== "engine") return;
              // Pick a sensible default name when switching kinds.
              const name =
                v === "engine"
                  ? (engines?.find((e) => e.isActive)?.name ?? "Stockfish")
                  : (config.name || defaultName(color));
              onChange({ ...config, kind: v, name });
            }}
            className="rounded-md border border-border bg-muted p-0.5"
          >
            <ToggleGroupItem
              value="human"
              className="h-6 px-2 text-xs data-[state=on]:bg-background"
            >
              Human
            </ToggleGroupItem>
            <ToggleGroupItem
              value="engine"
              className="h-6 px-2 text-xs data-[state=on]:bg-background"
            >
              Engine
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Name input (human) or engine dropdown (engine) */}
          {config.kind === "human" ? (
            <Input
              value={config.name}
              onChange={(e) => onChange({ ...config, name: e.target.value })}
              placeholder={defaultName(color)}
              className="h-7 flex-1 text-sm"
            />
          ) : (
            <Select
              value={config.engineId ?? undefined}
              onValueChange={(id) => {
                const eng = engines?.find((e) => e.id === id);
                onChange({
                  ...config,
                  engineId: id,
                  name: eng?.name ?? "Stockfish",
                });
              }}
            >
              <SelectTrigger className="h-7 flex-1 text-sm">
                <SelectValue placeholder="Select engine…" />
              </SelectTrigger>
              <SelectContent>
                {(engines ?? []).length === 0 && (
                  <SelectItem value="none" disabled>
                    No engines configured
                  </SelectItem>
                )}
                {(engines ?? []).map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                    {e.isActive ? " (active)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Time control — rendered on one card only (white). */}
          {showTimeControl && timeControl && onTimeControlChange && (
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">TC</Label>
              <Select
                value={tcKey(timeControl)}
                onValueChange={(k) => {
                  const preset = TIME_CONTROLS[Number(k)]?.value;
                  if (preset) onTimeControlChange(preset);
                }}
              >
                <SelectTrigger className="h-7 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_CONTROLS.map((tc, i) => (
                    <SelectItem key={tc.label} value={String(i)}>
                      {tc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Convert a PlayerConfig (UI shape) to the API PlayerSpec. */
export function toPlayerSpec(c: PlayerConfig): PlayerSpec {
  return { kind: c.kind, name: c.name || "Player", engineId: c.engineId };
}

function defaultName(color: PlayerColor): string {
  return color === "white" ? "White" : "Black";
}

/** Find the dropdown key matching a time control (falls back to 0 = Untimed). */
function tcKey(tc: TimeControl): string {
  const idx = TIME_CONTROLS.findIndex(
    (p) => p.value.minutes === tc.minutes && p.value.increment === tc.increment,
  );
  return String(idx >= 0 ? idx : 0);
}
