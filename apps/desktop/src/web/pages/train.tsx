/**
 * Train page — `/train`.
 *
 * Placeholder for training and puzzles UI.
 * This feature is deferred to a future phase.
 */
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { GraduationCap, Puzzle, Target, Brain, Clock } from "lucide-react";
import { PageContainer, PageHeader } from "../components/layout";

export default function TrainPage() {
	return (
		<PageContainer>
			<PageHeader
				title="Train"
				subtitle="Improve your chess with puzzles and targeted training."
				icon={<GraduationCap className="size-5" />}
			/>

			{/* Training modes */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Card className="cursor-pointer hover:border-purple-300 transition-colors">
					<CardContent className="flex flex-col items-center py-6 text-center">
						<div className="mb-3 rounded-full bg-purple-100 p-3">
							<Puzzle className="size-6 text-purple-600" />
						</div>
						<CardTitle className="mb-1 text-base">Tactics</CardTitle>
						<p className="text-sm text-muted-foreground/500">
							Solve tactical puzzles to improve your calculation.
						</p>
						<div className="mt-3 text-xs text-muted-foreground">Coming soon</div>
					</CardContent>
				</Card>

				<Card className="cursor-pointer hover:border-blue-300 transition-colors">
					<CardContent className="flex flex-col items-center py-6 text-center">
						<div className="mb-3 rounded-full bg-blue-100 p-3">
							<Target className="size-6 text-primary" />
						</div>
						<CardTitle className="mb-1 text-base">Endgames</CardTitle>
						<p className="text-sm text-muted-foreground/500">
							Practice essential endgame positions.
						</p>
						<div className="mt-3 text-xs text-muted-foreground">Coming soon</div>
					</CardContent>
				</Card>

				<Card className="cursor-pointer hover:border-emerald-300 transition-colors">
					<CardContent className="flex flex-col items-center py-6 text-center">
						<div className="mb-3 rounded-full bg-emerald-100 p-3">
							<Brain className="size-6 text-emerald-600" />
						</div>
						<CardTitle className="mb-1 text-base">Openings</CardTitle>
						<p className="text-sm text-muted-foreground/500">
							Drill your opening repertoire with spaced repetition.
						</p>
						<div className="mt-3 text-xs text-muted-foreground">Coming soon</div>
					</CardContent>
				</Card>
			</div>

			{/* Daily goals placeholder */}
			<Card className="mt-6">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Clock className="size-4" />
						Daily Goals
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between">
						<div>
							<p className="text-2xl font-bold">0 / 5</p>
							<p className="text-sm text-muted-foreground/500">Puzzles solved today</p>
						</div>
						<div>
							<p className="text-2xl font-bold">0 / 3</p>
							<p className="text-sm text-muted-foreground/500">Games reviewed today</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="mt-8 rounded-lg border border-dashed border-border p-8 text-center">
				<p className="text-muted-foreground/500">
					Training features are planned for a future release.
				</p>
			</div>
		</PageContainer>
	);
}
