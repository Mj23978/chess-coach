/**
 * FirstRunOnboarding — shown when the user has no games, no accounts,
 * and no engines. Gives them a clear path to get started.
 *
 * Appears at the top of the dashboard and dismisses once any game exists.
 */
import { Link } from "react-router-dom";
import { Swords, Upload, Download, UserPlus, ArrowRight } from "lucide-react";

const STEPS = [
	{
		icon: <UserPlus className="size-5" />,
		title: "Connect your accounts",
		description: "Link Chess.com or Lichess to auto-import your games.",
		link: "/accounts",
		linkText: "Go to Accounts",
	},
	{
		icon: <Download className="size-5" />,
		title: "Install an engine",
		description: "Download Stockfish for analysis and play.",
		link: "/engines",
		linkText: "Go to Engines",
	},
	{
		icon: <Upload className="size-5" />,
		title: "Import a game",
		description: "Paste a PGN from Chess.com, Lichess, or any source.",
		action: "import",
	},
	{
		icon: <Swords className="size-5" />,
		title: "Play a game",
		description: "Start a game against the engine or a friend.",
		link: "/board",
		linkText: "Open Board",
	},
];

interface FirstRunOnboardingProps {
	/** Callback to open the Import PGN modal. */
	onImportPgn: () => void;
	/** Which steps are already completed. */
	completed?: {
		hasAccounts?: boolean;
		hasEngine?: boolean;
		hasGames?: boolean;
	};
}

export function FirstRunOnboarding({
	onImportPgn,
	completed,
}: FirstRunOnboardingProps) {
	const done = completed ?? {};

	return (
		<div className="rounded-xl border border-chess-brown/10 bg-gradient-to-br from-chess-cream/80 to-background p-5">
			<div className="mb-4 flex items-start gap-3">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-chess-brown/10">
					<span className="text-xl">♚</span>
				</div>
				<div>
					<h3 className="font-semibold">Get started with Chess Coach</h3>
					<p className="text-sm text-muted-foreground">
						Follow these steps to set up your chess workspace.
					</p>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				{STEPS.map((step, i) => {
					const isCompleted =
						(step.action === "import" && done.hasGames) ||
						(step.link === "/accounts" && done.hasAccounts) ||
						(step.link === "/engines" && done.hasEngine);

					return (
						<div
							key={i}
							className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
								isCompleted
									? "border-success/20 bg-success/5 opacity-60"
									: "border-border bg-card hover:border-chess-brown/20 hover:bg-chess-cream/30"
							}`}
						>
							<span
								className={`mt-0.5 shrink-0 ${
									isCompleted ? "text-success" : "text-chess-brown"
								}`}
							>
								{isCompleted ? (
									<svg
										className="size-5"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth={2}
									>
										<path d="M20 6L9 17l-5-5" />
									</svg>
								) : (
									step.icon
								)}
							</span>
							<div className="min-w-0 flex-1">
								<div className="text-sm font-medium">{step.title}</div>
								<div className="text-xs text-muted-foreground">
									{step.description}
								</div>
								{!isCompleted &&
									(step.action === "import" ? (
										<button
											type="button"
											onClick={onImportPgn}
											className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
										>
											Import a game
											<ArrowRight className="size-3" />
										</button>
									) : (
										<Link
											to={step.link}
											className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
										>
											{step.linkText}
											<ArrowRight className="size-3" />
										</Link>
									))}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
