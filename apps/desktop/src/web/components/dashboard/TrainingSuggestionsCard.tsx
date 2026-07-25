/**
 * TrainingSuggestionsCard — placeholder card for the "what should I practice?"
 * surface that pawn-appetite has on its dashboard.
 *
 * Real suggestions (analyze your last loss, drill your weakest opening, keep a
 * puzzle streak) depend on the Training/puzzles phase, which is deferred. Until
 * then we show three static, navigation-friendly suggestions so the dashboard
 * layout is complete and the card is wired into the grid.
 *
 * Replace the body of this file when PLAN-003 (game review enrichment) and the
 * Training phase land.
 */

import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import type { LucideIcon } from "lucide-react";
import { Brain, LineChart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface Suggestion {
	id: string;
	icon: LucideIcon;
	title: string;
	detail: string;
	to: string;
}

const SUGGESTIONS: Suggestion[] = [
	{
		id: "analyze",
		icon: LineChart,
		title: "Analyze your last game",
		detail: "Run the engine over your most recent match to spot mistakes.",
		to: "/",
	},
	{
		id: "openings",
		icon: Brain,
		title: "Review your openings",
		detail: "Explore opening repertoires in the Files page.",
		to: "/files",
	},
	{
		id: "puzzles",
		icon: Sparkles,
		title: "Solve a puzzle",
		detail: "Tactical training arrives with the Training phase.",
		to: "/train",
	},
];

export function TrainingSuggestionsCard() {
	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle className="text-base">Suggestions</CardTitle>
				<p className="text-xs text-neutral-500">
					Quick wins to sharpen your play.
				</p>
			</CardHeader>
			<CardContent className="space-y-2">
				{SUGGESTIONS.map((s) => {
					const Icon = s.icon;
					return (
						<div
							key={s.id}
							className="flex items-center gap-3 rounded-md border border-neutral-200 p-3"
						>
							<Icon className="size-5 shrink-0 text-neutral-500" />
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{s.title}</p>
								<p className="truncate text-xs text-neutral-500">{s.detail}</p>
							</div>
							<Button asChild variant="outline" size="sm">
								<Link to={s.to}>Open</Link>
							</Button>
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
