/**
 * WelcomeCard (D1-001) — the dashboard hero.
 *
 * Greeting + two primary actions:
 *  - "Play Now" → navigates to /board (full play mode lands in PLAN-003).
 *  - "Import Game" → opens the app-level Import PGN modal (owned by App.tsx,
 *    also reachable from the TitleBar File menu).
 *
 * Plain presentational component; all behavior is passed in via props so the
 * dashboard page owns routing + modal state.
 */

import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Swords, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WelcomeCardProps {
	/** Open the app-level Import PGN modal. */
	onImportPgn: () => void;
	/** Override the greeting (e.g. "Welcome back, Sam"). Defaults to a generic line. */
	greeting?: string;
}

export function WelcomeCard({ onImportPgn, greeting }: WelcomeCardProps) {
	const navigate = useNavigate();

	return (
		// bg-gradient-to-br from-chess-cream hardcoded a fixed light cream
		// (#f5f0e8) that didn't flip in dark mode, rendering a bright slab.
		// Dropped — the Card's default bg-card now respects the theme. Keep
		// the subtle chess-brown hairline border for a touch of warmth.
		<Card className="border-chess-brown/10">
			<CardHeader>
				<div className="flex items-start gap-3">
					<div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-chess-brown/10">
						<span className="text-2xl">♚</span>
					</div>
					<div>
						<CardTitle className="text-2xl font-bold tracking-tight">
							{greeting ?? "Welcome to Chess Coach"}
						</CardTitle>
						<p className="mt-1 text-sm text-muted-foreground">
							Play a quick game, analyze your latest match, or import a PGN to find
							your mistakes.
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex flex-wrap gap-2">
					<Button onClick={() => navigate("/board")}>
						<Swords className="mr-1.5 size-4" />
						Play Now
					</Button>
					<Button variant="outline" onClick={onImportPgn}>
						<Upload className="mr-1.5 size-4" />
						Import Game
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
