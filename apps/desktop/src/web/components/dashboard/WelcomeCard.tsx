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
		<Card>
			<CardHeader>
				<CardTitle className="text-2xl font-bold">
					{greeting ?? "Welcome to Chess Coach"}
				</CardTitle>
				<p className="text-sm text-neutral-500">
					Play a quick game, analyze your latest match, or import a PGN to find
					your mistakes.
				</p>
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
