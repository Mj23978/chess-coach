/**
 * Dashboard — the landing page of the coach. Lists the user's imported games.
 *
 * This is the simple-page example: it hits the API with @tanstack/react-query
 * and renders a Card per game. No auth gating yet (the backend allows the
 * `/games/demo` demo user route without a session).
 */
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import { api, type GameDTO } from "../lib/api";

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<GameDTO[]>({
    queryKey: ["games"],
    queryFn: () => api("/games/demo"),
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
        <Button>Import PGN</Button>
      </header>

      {isLoading && <p className="text-neutral-500">Loading games…</p>}
      {error && (
        <p className="text-red-600">Failed to load games: {String(error)}</p>
      )}

      <div className="space-y-3">
        {data?.length === 0 && (
          <p className="text-neutral-500">No games yet. Import a PGN to begin.</p>
        )}
        {data?.map((g) => (
          <Card key={g.id}>
            <CardHeader>
              <CardTitle>{g.title ?? `${g.white ?? "?"} vs ${g.black ?? "?"}`}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">
                Result: <span className="font-mono">{g.result ?? "*"}</span>
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                {new Date(g.createdAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
