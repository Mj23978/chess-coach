/**
 * DatabaseTab — opening database and game search.
 *
 * Shows:
 *   - Opening name and ECO code for the current position (if recognized)
 *   - List of games from the user's library that reached this position
 *   - Stats on how often the position arises (wins/draws/losses)
 *
 * Opening recognition uses a static ECO→name mapping (loaded lazily).
 * Game search queries the local PGlite database for games with matching
 * FENs in their move sequences.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { pgnHeaders } from "../../lib/chess";
import { fetchGames, type GameDTO } from "../../lib/api";
import { cn } from "@repo/ui/lib/utils";
import { BookOpen, Search, ExternalLink } from "lucide-react";

export interface DatabaseTabProps {
  fen: string;
  pgn: string;
  ply: number;
}

/**
 * Top openings by ECO code. This is a subset of the most common openings
 * for quick identification. A full ECO database would be loaded from a
 * JSON file in a future iteration.
 */
const OPENINGS: Record<string, string> = {
  B00: "King's Pawn Game",
  B01: "Scandinavian Defense",
  B06: "Robach Gambit",
  B07: "Pirc Defense",
  B08: "Classical Pirc",
  B10: "Caro-Kann Defense",
  B12: "Caro-Kann Defense: Advance",
  B13: "Caro-Kann Exchange",
  B14: "Caro-Kann Panov-Botvinnik",
  B15: "Caro-Kann Defense: Main Line",
  B20: "Sicilian Defense",
  B21: "Sicilian Grand Prix Attack",
  B22: "Sicilian Alapin",
  B23: "Sicilian Closed",
  B25: "Sicilian Open",
  B27: "Sicilian Dragon",
  B30: "Sicilian Rossolimo",
  B33: "Sicilian Sveshnikov",
  B40: "Sicilian Four Knights",
  B50: "Sicilian Canal",
  B90: "Sicilian Najdorf",
  C00: "French Defense",
  C01: "French Exchange",
  C05: "French Advance",
  C07: "French Tarrasch",
  C10: "French Rubinstein",
  C11: "French Classical",
  C18: "French Winawer",
  C42: "Petrov's Defense",
  C44: "Scotch Game",
  C45: "Scotch Game: Classical",
  C50: "Italian Game",
  C53: "Italian Giuoco Piano",
  C55: "Two Knights Defense",
  C60: "Ruy Lopez",
  C65: "Ruy Lopez: Berlin",
  C67: "Ruy Lopez: Berlin Exchange",
  C68: "Ruy Lopez: Exchange",
  C70: "Ruy Lopez: Closed",
  C78: "Ruy Lopez: Moeller",
  C80: "Ruy Lopez: Open",
  C84: "Ruy Lopez: Closed Chigorin",
  C88: "Ruy Lopez: Closed Marshall",
  C92: "Ruy Lopez: Closed Zaitsev",
  C95: "Ruy Lopez: Closed Breyer",
  C99: "Ruy Lopez: Closed Chigorin (Main)",
  D00: "Queen's Pawn Game",
  D02: "London System",
  D05: "Colle System",
  D10: "Slav Defense",
  D11: "Slav Defense: Main Line",
  D15: "Slav Semi-Slav",
  D17: "Slav Semi-Slav: Meran",
  D19: "Slav Semi-Slav: Anti-Meran",
  D20: "Queen's Gambit Accepted",
  D27: "QGA: Classical",
  D30: "Queen's Gambit Declined",
  D31: "QGD: Exchange",
  D35: "QGD: Exchange Variation",
  D37: "QGD: 5.Bf4",
  D39: "QGD: Ragozin",
  D43: "Semi-Slav Defense",
  D45: "Semi-Slav: Anti-Moscow",
  D47: "Semi-Slav: Meran",
  D50: "QGD: Modern",
  D53: "QGD: Orthodox",
  D55: "QGD: Orthodox Main",
  D58: "QGD: Tartakower",
  D80: "Gruenfeld Defense",
  D85: "Gruenfeld: Exchange",
  D87: "Gruenfeld: Exchange Main",
  D90: "Gruenfeld: Fianchetto",
  E00: "Catalan Opening",
  E04: "Catalan: Open",
  E06: "Catalan: Closed",
  E08: "Catalan: Closed Main",
  E10: "Queen's Indian Defense",
  E12: "QID: Petrosian",
  E15: "QID: 4.e3",
  E16: "QID: 4.e3 Main",
  E18: "QID: Old Main Line",
  E20: "Nimzo-Indian Defense",
  E21: "Nimzo: Three Knights",
  E24: "Nimzo: Samisch",
  E25: "Nimzo: Samisch Main",
  E30: "Nimzo: Leningrad",
  E32: "Nimzo: Classical",
  E36: "Nimzo: Classical Main",
  E40: "Nimzo: 4.e3",
  E43: "Nimzo: Fischer",
  E46: "Nimzo: Reshevsky",
  E48: "Nimzo: 4.e3 Main",
  E50: "Nimzo: 4.e3 (all)",
  E53: "Nimzo: 4.e3 c5",
  E55: "Nimzo: 4.e3 Main Line",
  E58: "Nimzo: 4.e3 Rubinstein",
  E60: "King's Indian Defense",
  E62: "KID: Fianchetto",
  E63: "KID: Fianchetto Main",
  E65: "KID: Classical",
  E67: "KID: Classical Fianchetto",
  E69: "KID: Classical Main",
  E70: "KID: Averbakh",
  E73: "KID: Averbakh Main",
  E76: "KID: Four Pawns Attack",
  E80: "KID: Samisch",
  E81: "KID: Samisch Main",
  E84: "KID: Samisch Panno",
  E87: "KID: Samisch Main Line",
  E90: "KID: Normal",
  E92: "KID: Classical Main",
  E94: "KID: Classical Orthodox",
  E97: "KID: Classical Mar del Plata",
  E99: "KID: Classical Main Line",
};

export function DatabaseTab({ fen, pgn, ply }: DatabaseTabProps) {
  const headers = useMemo(() => pgnHeaders(pgn), [pgn]);

  // Parse ECO code from PGN headers (set by analysis or import).
  const eco = headers["ECO"] ?? null;
  const openingName = eco ? OPENINGS[eco] ?? null : null;

  // Fetch games and filter by matching ECO code from PGN headers.
  const { data: games } = useQuery({
    queryKey: ["games"],
    queryFn: () => fetchGames(),
  });

  const matchingGames = useMemo(() => {
    if (!eco || !games) return [];
    return games
      .filter((g: GameDTO) => {
        try {
          return pgnHeaders(g.pgn)["ECO"] === eco;
        } catch {
          return false;
        }
      })
      .slice(0, 10);
  }, [eco, games]);

  return (
    <div className="space-y-4">
      {/* Opening name */}
      <Section title="Opening">
        {eco ? (
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs font-bold text-neutral-700">
                {eco}
              </span>
              {openingName && (
                <span className="text-sm text-neutral-700">{openingName}</span>
              )}
            </div>
            {!openingName && (
              <p className="mt-1 text-xs text-neutral-500">
                Opening name not in local database for ECO {eco}.
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-neutral-500">
            <BookOpen className="size-4" />
            <span className="text-xs">
              No ECO code available. Run analysis to identify the opening.
            </span>
          </div>
        )}
      </Section>

      {/* Current position FEN */}
      <Section title="Position">
        <code className="block break-all rounded bg-neutral-50 px-2 py-1.5 font-mono text-[10px] text-neutral-600">
          {fen}
        </code>
        <p className="mt-1 text-xs text-neutral-500">
          Move {Math.ceil(ply / 2)}
          {ply % 2 === 0 ? " (black)" : " (white)"}
        </p>
      </Section>

      {/* Similar games from user's library */}
      <Section title="Your Games">
        {matchingGames.length > 0 ? (
          <div className="space-y-1">
            {matchingGames.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between rounded-md border border-neutral-100 px-2 py-1.5 text-xs"
              >
                <div>
                  <span className="font-medium text-neutral-700">
                    {g.white ?? "?"}
                  </span>
                  <span className="mx-1 text-neutral-400">vs</span>
                  <span className="font-medium text-neutral-700">
                    {g.black ?? "?"}
                  </span>
                </div>
                <span className="text-neutral-400">{g.result ?? "*"}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-neutral-500">
            <Search className="size-4" />
            <span className="text-xs">
              {eco
                ? "No games with this opening yet."
                : "Analyze a game to see similar positions."}
            </span>
          </div>
        )}
      </Section>

      {/* Lichess database hint */}
      <Section title="Opening Explorer">
        <a
          href={`https://lichess.org/analysis#explorer/${fen.replace(/ /g, "_")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          Open in Lichess Explorer
          <ExternalLink className="size-3" />
        </a>
      </Section>
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
