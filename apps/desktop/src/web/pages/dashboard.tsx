/**
 * Dashboard — the landing page of the coach. Lists the imported games.
 *
 * Hits the API with @tanstack/react-query and renders a Card per game. The
 * "Import PGN" button opens the ImportPgnModal; each card links to the review
 * page and shows an inline Analyze action. chess-coach is a local single-user
 * app, so there is no owner dimension — `/games` returns every stored game.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import { Link } from "react-router-dom";
import {
  fetchGames,
  analyzeGame,
  type GameDTO,
} from "../lib/api";
import { ImportPgnModal } from "../components/import-pgn-modal";

export default function DashboardPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery<GameDTO[]>({
    queryKey: ["games"],
    queryFn: fetchGames,
  });

  const analyzeMut = useMutation({
    mutationFn: (id: string) => analyzeGame(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["games"] }),
  });

  return (
    <div className="mx-auto max-w-3xl p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chess Coach</h1>
          <p className="text-sm text-neutral-500">
            Analyze your games and find your mistakes.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Import PGN</Button>
      </header>

      {modalOpen && (
        <ImportPgnModal
          onClose={() => setModalOpen(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ["games"] })}
        />
      )}

      {isLoading && <p className="text-neutral-500">Loading games…</p>}
      {error && (
        <p className="text-red-600">Failed to load games: {String(error)}</p>
      )}

      <div className="space-y-3">
        {data?.length === 0 && (
          <p className="text-neutral-500">No games yet. Import a PGN to begin.</p>
        )}
        {data?.map((g) => {
          const analyzed = (g.analysis?.length ?? 0) > 0;
          return (
            <Card key={g.id}>
              <CardHeader>
                <CardTitle>
                  <Link
                    to={`/games/${g.id}`}
                    className="hover:underline"
                  >
                    {g.title ??
                      `${g.white ?? "White"} vs ${g.black ?? "Black"}`}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">
                      Result:{" "}
                      <span className="font-mono">{g.result ?? "*"}</span>
                      {analyzed && (
                        <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">
                          analyzed
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {new Date(g.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => analyzeMut.mutate(g.id)}
                      disabled={analyzeMut.isPending}
                    >
                      {analyzeMut.isPending && analyzeMut.variables === g.id
                        ? "Analyzing…"
                        : analyzed
                          ? "Re-analyze"
                          : "Analyze"}
                    </Button>
                    <Link to={`/games/${g.id}`}>
                      <Button size="sm">Review</Button>
                    </Link>
                  </div>
                </div>
                {analyzeMut.isError && analyzeMut.variables === g.id && (
                  <p className="mt-2 text-xs text-red-600">
                    {analyzeMut.error instanceof Error
                      ? analyzeMut.error.message
                      : "Analysis failed"}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
