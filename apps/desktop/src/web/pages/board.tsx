/**
 * Board page — `/board`.
 *
 * Placeholder for the tabbed board interface (Play Game, Analysis, etc.).
 * Will be implemented in Phase 3 (Board Page Redesign).
 */
import { Link } from "react-router-dom";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";

export default function BoardPage() {
	return (
		<div className="mx-auto max-w-4xl p-8">
			<header className="mb-6">
				<Link to="/" className="text-xs text-blue-600">
					← Dashboard
				</Link>
				<h1 className="mt-1 text-2xl font-bold">Board</h1>
				<p className="text-sm text-neutral-500">
					Play games, analyze positions, and review your openings.
				</p>
			</header>

			<div className="grid gap-4 md:grid-cols-2">
				<Card className="cursor-pointer hover:border-blue-300 transition-colors">
					<CardHeader>
						<CardTitle className="text-lg">Play Game</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-neutral-600">
							Start a new game against the engine or a human opponent.
						</p>
					</CardContent>
				</Card>

				<Card className="cursor-pointer hover:border-blue-300 transition-colors">
					<CardHeader>
						<CardTitle className="text-lg">Analysis</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-neutral-600">
							Analyze a position with engine support and explore variations.
						</p>
					</CardContent>
				</Card>

				<Card className="cursor-pointer hover:border-blue-300 transition-colors">
					<CardHeader>
						<CardTitle className="text-lg">Enter FEN</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-neutral-600">
							Load a custom position from a FEN string.
						</p>
					</CardContent>
				</Card>

				<Card className="cursor-pointer hover:border-blue-300 transition-colors">
					<CardHeader>
						<CardTitle className="text-lg">Openings</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-neutral-600">
							Explore and study your opening repertoire.
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-8 text-center">
				<p className="text-neutral-500">
					Board page will be fully implemented in Phase 3.
				</p>
			</div>
		</div>
	);
}
