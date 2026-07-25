/**
 * TimeControlGrid (D1-005/006/007) — four quick-start cards for the standard
 * time controls.
 *
 * Clicking a card navigates to `/board` with the chosen time control passed as
 * router state. Full play mode (engine + clock) lands in PLAN-003; until then
 * the board page can read `location.state.timeControl` to pre-fill its config.
 *
 * The TIME_CONTROLS map is the single source of truth for these presets —
 * PLAN-003 will likely consume the same shape.
 */

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import type { LucideIcon } from "lucide-react";
import { Clock, Hourglass, Rocket, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface TimeControl {
	/** Stable id used as the router-state value. */
	id: "classical" | "rapid" | "blitz" | "bullet";
	label: string;
	/** "15+10" base+increment in minutes/seconds. */
	time: string;
	/** Base minutes per side. */
	minutes: number;
	/** Increment per move in seconds. */
	increment: number;
	icon: LucideIcon;
	description: string;
	accent: string;
}

export const TIME_CONTROLS: TimeControl[] = [
	{
		id: "classical",
		label: "Classical",
		time: "15+10",
		minutes: 15,
		increment: 10,
		icon: Hourglass,
		description: "Deep thinking, long games.",
		accent: "text-sky-600",
	},
	{
		id: "rapid",
		label: "Rapid",
		time: "10+0",
		minutes: 10,
		increment: 0,
		icon: Clock,
		description: "Balanced pace for most players.",
		accent: "text-teal-600",
	},
	{
		id: "blitz",
		label: "Blitz",
		time: "3+2",
		minutes: 3,
		increment: 2,
		icon: Zap,
		description: "Fast and tactical.",
		accent: "text-amber-600",
	},
	{
		id: "bullet",
		label: "Bullet",
		time: "1+0",
		minutes: 1,
		increment: 0,
		icon: Rocket,
		description: "Lightning quick — instinct over calculation.",
		accent: "text-rose-600",
	},
];

export function TimeControlGrid() {
	const navigate = useNavigate();

	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle className="text-base">Quick Start</CardTitle>
				<p className="text-xs text-neutral-500">
					Pick a time control to start a new game.
				</p>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
					{TIME_CONTROLS.map((tc) => {
						const Icon = tc.icon;
						return (
							<button
								key={tc.id}
								type="button"
								onClick={() =>
									navigate("/board", {
										state: { timeControl: tc },
									})
								}
								className="group flex flex-col items-start gap-2 rounded-lg border border-neutral-200 p-3 text-left transition-colors hover:border-neutral-400 hover:bg-neutral-50"
							>
								<Icon className={`size-6 ${tc.accent}`} />
								<div>
									<p className="text-sm font-semibold">{tc.label}</p>
									<p className="font-mono text-xs text-neutral-500">
										{tc.time}
									</p>
								</div>
								<p className="text-xs text-neutral-500">{tc.description}</p>
							</button>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
