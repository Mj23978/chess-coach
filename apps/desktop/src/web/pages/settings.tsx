/**
 * Settings page — `/settings`.
 *
 * App-level configuration. Engine management has moved to its own page
 * (`@/pages/engines`, reachable from the nav rail); this page now hosts
 * general settings. The tabs below will grow in Phase 8 (Settings &
 * Keybindings); for now only "About" has content.
 */
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";

export default function SettingsPage() {
	return (
		<div className="mx-auto max-w-3xl p-8">
			<header className="mb-6">
				<h1 className="text-2xl font-bold">Settings</h1>
				<p className="text-sm text-neutral-500">
					General configuration for Chess Coach.
				</p>
			</header>

			<AboutSection />
		</div>
	);
}

function AboutSection() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>About</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2 text-sm">
				<p>
					<span className="font-medium">Version:</span> 0.1.0
				</p>
				<p className="text-neutral-600">
					A desktop chess coach app: analyze your games, play against the
					engine, and improve your chess.
				</p>
				<p className="text-neutral-600">
					Built with Electrobun, React, and Stockfish.
				</p>
			</CardContent>
		</Card>
	);
}
