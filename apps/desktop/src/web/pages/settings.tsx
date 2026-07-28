/**
 * Settings page — `/settings` (PLAN-015).
 *
 * App-level configuration with sections for Appearance, Engine defaults,
 * Sync preferences, Keyboard shortcuts, and About. All settings are backed
 * by the settings table via SettingsContext — changes persist to the DB
 * immediately and survive app restarts.
 */
import { useState } from "react";
import {
	Settings,
	Palette,
	Cpu,
	RefreshCw,
	Keyboard,
	Info,
	ChevronRight,
	Monitor,
	Moon,
	Sun,
} from "lucide-react";
import { Card, CardContent } from "@repo/ui/components/card";
import { Switch } from "@repo/ui/components/switch";
import { useSettings } from "../lib/settings-context";
import { ALL_SHORTCUTS } from "../lib/useKeyboardShortcuts";
import { PageContainer } from "../components/layout";

type Theme = "light" | "dark" | "system";

export default function SettingsPage() {
	const { settings, updateSettings } = useSettings();
	const [activeSection, setActiveSection] = useState<string | null>(null);

	return (
		<PageContainer>
			<header className="mb-6">
				<div className="flex items-center gap-3">
					<div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
						<Settings className="size-5" />
					</div>
					<div>
						<h1 className="text-2xl font-bold">Settings</h1>
						<p className="mt-0.5 text-sm text-neutral-500">
							Configure your chess coach experience.
						</p>
					</div>
				</div>
			</header>

			<div className="space-y-3">
				<SectionCard
					icon={<Palette className="size-5" />}
					title="Appearance"
					description="Theme, board style, and visual preferences"
					isOpen={activeSection === "appearance"}
					onToggle={() =>
						setActiveSection(activeSection === "appearance" ? null : "appearance")
					}
				>
					<AppearanceSection onUpdate={updateSettings} />
				</SectionCard>

				<SectionCard
					icon={<Cpu className="size-5" />}
					title="Engine Defaults"
					description="Default engine settings for analysis and play"
					isOpen={activeSection === "engine"}
					onToggle={() =>
						setActiveSection(activeSection === "engine" ? null : "engine")
					}
				>
					<EngineSection onUpdate={updateSettings} />
				</SectionCard>

				<SectionCard
					icon={<RefreshCw className="size-5" />}
					title="Sync"
					description="Automatic game synchronization preferences"
					isOpen={activeSection === "sync"}
					onToggle={() =>
						setActiveSection(activeSection === "sync" ? null : "sync")
					}
				>
					<SyncSection onUpdate={updateSettings} />
				</SectionCard>

				<SectionCard
					icon={<Keyboard className="size-5" />}
					title="Keyboard Shortcuts"
					description="View and customize keyboard shortcuts"
					isOpen={activeSection === "shortcuts"}
					onToggle={() =>
						setActiveSection(activeSection === "shortcuts" ? null : "shortcuts")
					}
				>
					<ShortcutsSection />
				</SectionCard>

				<SectionCard
					icon={<Info className="size-5" />}
					title="About"
					description="App version and information"
					isOpen={activeSection === "about"}
					onToggle={() =>
						setActiveSection(activeSection === "about" ? null : "about")
					}
				>
					<AboutSection />
				</SectionCard>
			</div>
		</PageContainer>
	);
}

// ---------------------------------------------------------------------------
// Section card wrapper
// ---------------------------------------------------------------------------

function SectionCard({
	icon,
	title,
	description,
	isOpen,
	onToggle,
	children,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	isOpen: boolean;
	onToggle: () => void;
	children: React.ReactNode;
}) {
	return (
		<Card className="overflow-hidden">
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full items-center justify-between p-4 text-left"
			>
				<div className="flex items-center gap-3">
					<div className="flex size-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
						{icon}
					</div>
					<div>
						<h2 className="font-semibold">{title}</h2>
						<p className="text-xs text-neutral-500">{description}</p>
					</div>
				</div>
				<ChevronRight
					className={`size-5 text-neutral-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
				/>
			</button>
			<div
				className="grid transition-[grid-template-rows] duration-200 ease-in-out"
				style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
			>
				<div className="overflow-hidden">
					<CardContent className="border-t border-neutral-100 pt-4">
						{children}
					</CardContent>
				</div>
			</div>
		</Card>
	);
}

// ---------------------------------------------------------------------------
// Appearance section
// ---------------------------------------------------------------------------

function AppearanceSection({
	onUpdate,
}: {
	onUpdate: (patch: Record<string, unknown>) => Promise<void>;
}) {
	const { settings } = useSettings();

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
			{/* Theme */}
			<div>
				<label className="mb-2 block text-sm font-medium">Theme</label>
				<div className="flex gap-2">
					{themes.map((t) => (
						<button
							key={t.value}
							type="button"
							onClick={() => onUpdate({ theme: t.value })}
							className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
								settings.theme === t.value
									? "border-blue-500 bg-blue-50 text-blue-700"
									: "border-neutral-200 hover:border-neutral-300"
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
							onClick={() => onUpdate({ boardStyle: s.value })}
							className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
								settings.boardStyle === s.value
									? "border-blue-500 bg-blue-50 text-blue-700"
									: "border-neutral-200 hover:border-neutral-300"
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
					onCheckedChange={(v) => onUpdate({ showCoords: v })}
				/>
				<ToggleRow
					label="Highlight last move"
					description="Show the last played move with a colored highlight"
					checked={settings.highlightLastMove}
					onCheckedChange={(v) => onUpdate({ highlightLastMove: v })}
				/>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Engine defaults section
// ---------------------------------------------------------------------------

function EngineSection({
	onUpdate,
}: {
	onUpdate: (patch: Record<string, unknown>) => Promise<void>;
}) {
	const { settings } = useSettings();

	return (
		<div className="space-y-4">
			<div>
				<label className="mb-1 block text-sm font-medium">Default Engine</label>
				<select
					value={settings.defaultEngine}
					onChange={(e) => onUpdate({ defaultEngine: e.target.value })}
					className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
				onCheckedChange={(v) => onUpdate({ autoAnalyze: v })}
			/>

			<div>
				<label className="mb-1 block text-sm font-medium">
					Analysis Depth: {settings.analysisDepth}
				</label>
				<input
					type="range"
					min={10}
					max={40}
					value={settings.analysisDepth}
					onChange={(e) =>
						onUpdate({ analysisDepth: Number(e.target.value) })
					}
					className="w-full"
				/>
				<div className="flex justify-between text-xs text-neutral-500">
					<span>Fast (10)</span>
					<span>Deep (40)</span>
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Sync section
// ---------------------------------------------------------------------------

function SyncSection({
	onUpdate,
}: {
	onUpdate: (patch: Record<string, unknown>) => Promise<void>;
}) {
	const { settings } = useSettings();

	return (
		<div className="space-y-3">
			<ToggleRow
				label="Sync on app start"
				description="Automatically sync games when the app launches"
				checked={settings.syncOnStart}
				onCheckedChange={(v) => onUpdate({ syncOnStart: v })}
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
						onUpdate({ syncInterval: Number(e.target.value) })
					}
					className="w-full"
				/>
				<div className="flex justify-between text-xs text-neutral-500">
					<span>15 min</span>
					<span>6 hours</span>
				</div>
			</div>

			<div className="border-t border-neutral-100 pt-3">
				<h3 className="mb-2 text-sm font-medium">Auto-import</h3>
				<ToggleRow
					label="Chess.com"
					description="Automatically import new games from Chess.com"
					checked={settings.autoImportChessCom}
					onCheckedChange={(v) => onUpdate({ autoImportChessCom: v })}
				/>
				<ToggleRow
					label="Lichess"
					description="Automatically import new games from Lichess"
					checked={settings.autoImportLichess}
					onCheckedChange={(v) => onUpdate({ autoImportLichess: v })}
				/>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Keyboard shortcuts section
// ---------------------------------------------------------------------------

function ShortcutsSection() {
	return (
		<div className="space-y-4">
			{ALL_SHORTCUTS.map((group) => (
				<div key={group.category}>
					<h3 className="mb-2 text-sm font-medium text-neutral-700">
						{group.category}
					</h3>
					<div className="rounded-lg border border-neutral-200">
						{group.shortcuts.map((shortcut, i) => (
							<div
								key={shortcut.keys}
								className={`flex items-center justify-between px-3 py-2 text-sm ${
									i !== group.shortcuts.length - 1
										? "border-b border-neutral-100"
										: ""
								}`}
							>
								<span className="text-neutral-600">
									{shortcut.description}
								</span>
								<kbd className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-700">
									{shortcut.keys}
								</kbd>
							</div>
						))}
					</div>
				</div>
			))}
			<p className="text-xs text-neutral-500">
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
		<div className="space-y-3 text-sm">
			<div className="flex items-center gap-3">
				<div className="flex size-12 items-center justify-center rounded-xl bg-neutral-100">
					<span className="text-2xl">♚</span>
				</div>
				<div>
					<h3 className="font-semibold">Chess Coach</h3>
					<p className="text-neutral-500">Version 0.1.0</p>
				</div>
			</div>
			<p className="text-neutral-600">
				A desktop chess coach app: analyze your games, play against the
				engine, and improve your chess.
			</p>
			<p className="text-neutral-600">
				Built with Electrobun, React, and Stockfish.
			</p>
			<div className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-500">
				<p>
					<strong>Engine:</strong> Stockfish (included) — the strongest
					open-source chess engine.
				</p>
				<p className="mt-1">
					<strong>Database:</strong> Embedded PGlite (PostgreSQL) — all
					data stays on your machine.
				</p>
			</div>
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
		<div className="flex items-center justify-between gap-4 rounded-lg border border-neutral-100 p-3">
			<div className="min-w-0">
				<div className="text-sm font-medium">{label}</div>
				<div className="text-xs text-neutral-500">{description}</div>
			</div>
			<Switch checked={checked} onCheckedChange={onCheckedChange} />
		</div>
	);
}
