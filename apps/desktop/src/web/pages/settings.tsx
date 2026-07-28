/**
 * Settings page — `/settings` (PLAN-015).
 *
 * Two-column layout: section nav on the left, content on the right.
 * This eliminates the accordion-driven layout shift — the content area
 * has a fixed height and swaps content instantly via tab selection.
 */
import { useState } from "react";
import {
	Settings,
	Palette,
	Cpu,
	RefreshCw,
	Keyboard,
	Info,
	Monitor,
	Moon,
	Sun,
} from "lucide-react";
import { Switch } from "@repo/ui/components/switch";
import { useSettings } from "../lib/settings-context";
import { ALL_SHORTCUTS } from "../lib/useKeyboardShortcuts";
import { PageContainer, PageHeader } from "../components/layout";

type Theme = "light" | "dark" | "system";
type SectionId = "appearance" | "engine" | "sync" | "shortcuts" | "about";

const SECTIONS: Array<{
	id: SectionId;
	icon: React.ReactNode;
	title: string;
	description: string;
}> = [
	{
		id: "appearance",
		icon: <Palette className="size-4" />,
		title: "Appearance",
		description: "Theme, board style, and visual preferences",
	},
	{
		id: "engine",
		icon: <Cpu className="size-4" />,
		title: "Engine",
		description: "Default engine settings for analysis and play",
	},
	{
		id: "sync",
		icon: <RefreshCw className="size-4" />,
		title: "Sync",
		description: "Automatic game synchronization preferences",
	},
	{
		id: "shortcuts",
		icon: <Keyboard className="size-4" />,
		title: "Shortcuts",
		description: "Keyboard shortcuts reference",
	},
	{
		id: "about",
		icon: <Info className="size-4" />,
		title: "About",
		description: "App version and information",
	},
];

export default function SettingsPage() {
	const [activeSection, setActiveSection] = useState<SectionId>("appearance");

	return (
		<PageContainer>
			<PageHeader
				title="Settings"
				subtitle="Configure your chess coach experience."
				icon={<Settings className="size-5" />}
			/>

			<div className="flex gap-6">
				{/* Left: section navigation */}
				<nav className="w-56 shrink-0">
					<div className="space-y-1">
						{SECTIONS.map((s) => (
							<button
								key={s.id}
								type="button"
								onClick={() => setActiveSection(s.id)}
								className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
									activeSection === s.id
										? "bg-primary/10 text-primary font-medium"
										: "text-muted-foreground hover:bg-muted hover:text-foreground"
								}`}
							>
								<span className="shrink-0">{s.icon}</span>
								<span>{s.title}</span>
							</button>
						))}
					</div>
				</nav>

				{/* Right: section content */}
				<div className="min-w-0 flex-1">
					<div className="rounded-xl border border-border bg-card p-6">
						{activeSection === "appearance" && <AppearanceSection />}
						{activeSection === "engine" && <EngineSection />}
						{activeSection === "sync" && <SyncSection />}
						{activeSection === "shortcuts" && <ShortcutsSection />}
						{activeSection === "about" && <AboutSection />}
					</div>
				</div>
			</div>
		</PageContainer>
	);
}

// ---------------------------------------------------------------------------
// Appearance section
// ---------------------------------------------------------------------------

function AppearanceSection() {
	const { settings, updateSettings } = useSettings();

	const themes: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
		{ value: "light", label: "Light", icon: <Sun className="size-4" /> },
		{ value: "dark", label: "Dark", icon: <Moon className="size-4" /> },
		{ value: "system", label: "System", icon: <Monitor className="size-4" /> },
	];

	const boardStyles = [
		{ value: "brown" as const, label: "Classic Brown", color: "bg-amber-600" },
		{ value: "blue" as const, label: "Ocean Blue", color: "bg-blue-500" },
		{ value: "green" as const, label: "Forest Green", color: "bg-emerald-600" },
		{ value: "purple" as const, label: "Royal Purple", color: "bg-purple-600" },
	];

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold">Appearance</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Customize the look and feel of your chess coach.
				</p>
			</div>

			{/* Theme */}
			<div>
				<label className="mb-2 block text-sm font-medium">Theme</label>
				<div className="flex gap-2">
					{themes.map((t) => (
						<button
							key={t.value}
							type="button"
							onClick={() => updateSettings({ theme: t.value })}
							className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
								settings.theme === t.value
									? "border-primary bg-primary/10 text-primary"
									: "border-border hover:border-border/80"
							}`}
						>
							{t.icon}
							{t.label}
						</button>
					))}
				</div>
			</div>

			{/* Board style */}
			<div>
				<label className="mb-2 block text-sm font-medium">Board Colors</label>
				<div className="flex gap-2">
					{boardStyles.map((s) => (
						<button
							key={s.value}
							type="button"
							onClick={() => updateSettings({ boardStyle: s.value })}
							className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
								settings.boardStyle === s.value
									? "border-primary bg-primary/10 text-primary"
									: "border-border hover:border-border/80"
							}`}
						>
							<div className={`size-4 rounded ${s.color}`} />
							{s.label}
						</button>
					))}
				</div>
			</div>

			{/* Toggle options */}
			<div className="space-y-3">
				<ToggleRow
					label="Show coordinates"
					description="Display rank and file labels on the board"
					checked={settings.showCoords}
					onCheckedChange={(v) => updateSettings({ showCoords: v })}
				/>
				<ToggleRow
					label="Highlight last move"
					description="Show the last played move with a colored highlight"
					checked={settings.highlightLastMove}
					onCheckedChange={(v) => updateSettings({ highlightLastMove: v })}
				/>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Engine defaults section
// ---------------------------------------------------------------------------

function EngineSection() {
	const { settings, updateSettings } = useSettings();

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold">Engine Defaults</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Configure the chess engine used for analysis and play.
				</p>
			</div>

			<div>
				<label className="mb-1 block text-sm font-medium">Default Engine</label>
				<select
					value={settings.defaultEngine}
					onChange={(e) => updateSettings({ defaultEngine: e.target.value })}
					className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
				>
					<option value="Stockfish">Stockfish</option>
					<option value="Komodo">Komodo</option>
					<option value="Leela Chess Zero">Leela Chess Zero</option>
				</select>
			</div>

			<ToggleRow
				label="Auto-analyze games"
				description="Automatically run engine analysis after importing or completing a game"
				checked={settings.autoAnalyze}
				onCheckedChange={(v) => updateSettings({ autoAnalyze: v })}
			/>

			<div>
				<label className="mb-1 block text-sm font-medium">
					Analysis Depth: {settings.analysisDepth}
				</label>
				<input
					type="range"
					min={8}
					max={22}
					value={settings.analysisDepth}
					onChange={(e) =>
						updateSettings({ analysisDepth: Number(e.target.value) })
					}
					className="w-full"
				/>
				<div className="flex justify-between text-xs text-muted-foreground">
					<span>Fast (8)</span>
					<span>Default (15)</span>
					<span>Deep (22)</span>
				</div>
				<p className="mt-1 text-xs text-muted-foreground">
					Lower = faster analysis (a few seconds per move). Higher = stronger
					but much slower on Stockfish Lite.
				</p>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Sync section
// ---------------------------------------------------------------------------

function SyncSection() {
	const { settings, updateSettings } = useSettings();

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold">Sync</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Control how your games are synchronized from Chess.com and Lichess.
				</p>
			</div>

			<div className="space-y-3">
				<ToggleRow
					label="Sync on app start"
					description="Automatically sync games when the app launches"
					checked={settings.syncOnStart}
					onCheckedChange={(v) => updateSettings({ syncOnStart: v })}
				/>

				<div>
					<label className="mb-1 block text-sm font-medium">
						Sync Interval: every {settings.syncInterval} minutes
					</label>
					<input
						type="range"
						min={15}
						max={360}
						step={15}
						value={settings.syncInterval}
						onChange={(e) =>
							updateSettings({ syncInterval: Number(e.target.value) })
						}
						className="w-full"
					/>
					<div className="flex justify-between text-xs text-muted-foreground">
						<span>15 min</span>
						<span>6 hours</span>
					</div>
				</div>
			</div>

			<div className="border-t border-border pt-4">
				<h3 className="mb-3 text-sm font-medium">Auto-import</h3>
				<div className="space-y-3">
					<ToggleRow
						label="Chess.com"
						description="Automatically import new games from Chess.com"
						checked={settings.autoImportChessCom}
						onCheckedChange={(v) => updateSettings({ autoImportChessCom: v })}
					/>
					<ToggleRow
						label="Lichess"
						description="Automatically import new games from Lichess"
						checked={settings.autoImportLichess}
						onCheckedChange={(v) => updateSettings({ autoImportLichess: v })}
					/>
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Keyboard shortcuts section
// ---------------------------------------------------------------------------

function ShortcutsSection() {
	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Quick actions available anywhere in the app.
				</p>
			</div>

			<div className="space-y-4">
				{ALL_SHORTCUTS.map((group) => (
					<div key={group.category}>
						<h3 className="mb-2 text-sm font-medium text-foreground">
							{group.category}
						</h3>
						<div className="rounded-lg border border-border">
							{group.shortcuts.map((shortcut, i) => (
								<div
									key={shortcut.keys}
									className={`flex items-center justify-between px-3 py-2 text-sm ${
										i !== group.shortcuts.length - 1
											? "border-b border-border"
											: ""
									}`}
								>
									<span className="text-muted-foreground">
										{shortcut.description}
									</span>
									<kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
										{shortcut.keys}
									</kbd>
								</div>
							))}
						</div>
					</div>
				))}
			</div>

			<p className="text-xs text-muted-foreground">
				Shortcuts are active globally. Game navigation shortcuts (←/→,
				Home/End, F) only work when a board is visible.
			</p>
		</div>
	);
}

// ---------------------------------------------------------------------------
// About section
// ---------------------------------------------------------------------------

function AboutSection() {
	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold">About</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Information about your chess coach app.
				</p>
			</div>

			<div className="flex items-center gap-3">
				<div className="flex size-12 items-center justify-center rounded-xl bg-chess-brown/10">
					<span className="text-2xl">♚</span>
				</div>
				<div>
					<h3 className="font-semibold">Chess Coach</h3>
					<p className="text-sm text-muted-foreground">Version 0.1.0</p>
				</div>
			</div>

			<p className="text-sm text-muted-foreground">
				A desktop chess coach app: analyze your games, play against the
				engine, and improve your chess.
			</p>

			<div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
				<p>
					<strong>Engine:</strong> Stockfish (included) — the strongest
					open-source chess engine.
				</p>
				<p className="mt-1">
					<strong>Database:</strong> Embedded PGlite (PostgreSQL) — all
					data stays on your machine.
				</p>
			</div>

			<p className="text-xs text-muted-foreground">
				Built with Electrobun, React, and Stockfish.
			</p>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Shared toggle row
// ---------------------------------------------------------------------------

function ToggleRow({
	label,
	description,
	checked,
	onCheckedChange,
}: {
	label: string;
	description: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
			<div className="min-w-0">
				<div className="text-sm font-medium">{label}</div>
				<div className="text-xs text-muted-foreground">{description}</div>
			</div>
			<Switch checked={checked} onCheckedChange={onCheckedChange} />
		</div>
	);
}
