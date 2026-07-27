/**
 * InfoTab — game metadata display.
 *
 * Shows:
 *   - PGN headers (Event, Site, Date, Round, Players, Result, ECO, etc.)
 *   - Current position FEN
 *   - Move count and game phase
 *   - Game classification summary
 */
import { useMemo } from "react";
import { pgnHeaders } from "../../lib/chess";
import { Copy } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { copyFenToClipboard } from "../../lib/export";
import { toast, TOAST_MESSAGES } from "../../components/ui";

export interface InfoTabProps {
  pgn: string;
  fen: string;
  ply: number;
  totalPlies: number;
}

export function InfoTab({ pgn, fen, ply, totalPlies }: InfoTabProps) {
  const headers = useMemo(() => pgnHeaders(pgn), [pgn]);

  const moveNumber = Math.ceil(ply / 2);
  const isBlackTurn = ply % 2 === 0 && ply > 0;

  // Determine game phase from material on board (rough heuristic).
  const phase = totalPlies <= 10 ? "Opening" : totalPlies <= 40 ? "Middlegame" : "Endgame";

  return (
    <div className="space-y-4">
      {/* PGN Headers */}
      <Section title="Game Info">
        <div className="space-y-1.5">
          {headers["Event"] && (
            <InfoRow label="Event" value={headers["Event"]} />
          )}
          {headers["Site"] && (
            <InfoRow label="Site" value={headers["Site"]} />
          )}
          {headers["Date"] && (
            <InfoRow label="Date" value={headers["Date"]} />
          )}
          {headers["Round"] && (
            <InfoRow label="Round" value={headers["Round"]} />
          )}
          <InfoRow label="White" value={headers["White"] ?? "?"} bold />
          <InfoRow label="Black" value={headers["Black"] ?? "?"} bold />
          <InfoRow label="Result" value={headers["Result"] ?? "*"} />
          {headers["ECO"] && (
            <InfoRow label="ECO" value={headers["ECO"]} />
          )}
          {headers["Opening"] && (
            <InfoRow label="Opening" value={headers["Opening"]} />
          )}
          {headers["Annotator"] && (
            <InfoRow label="Annotator" value={headers["Annotator"]} />
          )}
          {headers["TimeControl"] && (
            <InfoRow label="Time Control" value={headers["TimeControl"]} />
          )}
          {headers["WhiteElo"] && (
            <InfoRow label="White Elo" value={headers["WhiteElo"]} />
          )}
          {headers["BlackElo"] && (
            <InfoRow label="Black Elo" value={headers["BlackElo"]} />
          )}
        </div>
      </Section>

      {/* Current Position */}
      <Section title="Current Position">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded bg-neutral-50 px-2 py-1.5 font-mono text-[10px] text-neutral-600">
              {fen}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                copyFenToClipboard(fen).then((ok) => {
                  if (ok) toast.success(TOAST_MESSAGES.FEN_COPIED);
                  else toast.error("Failed to copy FEN");
                });
              }}
              className="shrink-0"
            >
              <Copy className="size-3" />
            </Button>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span>
              Move {moveNumber}
              {isBlackTurn ? " (black)" : " (white)"}
            </span>
            <span>·</span>
            <span>Phase: {phase}</span>
            <span>·</span>
            <span>{totalPlies} moves</span>
          </div>
        </div>
      </Section>

      {/* Full PGN */}
      <Section title="PGN">
        <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded bg-neutral-50 p-2 font-mono text-[10px] leading-relaxed text-neutral-600">
          {pgn}
        </pre>
      </Section>
    </div>
  );
}

function InfoRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="shrink-0 text-xs text-neutral-500">{label}</span>
      <span
        className={`truncate text-right text-xs ${
          bold ? "font-medium text-neutral-800" : "text-neutral-600"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400">
        {title}
      </h3>
      {children}
    </div>
  );
}
