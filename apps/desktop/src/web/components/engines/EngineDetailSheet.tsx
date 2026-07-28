/**
 * EngineDetailSheet — slide-over panel showing engine details.
 *
 * Shows the engine's binary path, existence status, UCI options, and a live
 * health check result. Opened when clicking on an EngineCard.
 */
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	Cpu,
	Check,
	X,
	CircleCheck,
	CircleX,
	Loader2,
	FolderOpen,
	Settings2,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import {
	fetchEngineHealth,
	type EngineDTO,
	type EngineHealthDTO,
} from "../../lib/api";

interface EngineDetailSheetProps {
	engine: EngineDTO;
	onClose: () => void;
}

export function EngineDetailSheet({ engine, onClose }: EngineDetailSheetProps) {
	const { data: health, isLoading: healthLoading } = useQuery({
		queryKey: ["engine-health", engine.id],
		queryFn: fetchEngineHealth,
		staleTime: 30_000,
	});

	// Close on Escape key (document-level, since this isn't a Radix Dialog).
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	return (
		<>
			{/* Backdrop — handles click-to-close and Escape key */}
			<div
				className="fixed inset-0 z-50 bg-black/30 transition-opacity"
				tabIndex={-1}
				onClick={onClose}
				onKeyDown={(e) => e.key === "Escape" && onClose()}
			/>
			{/* Sheet */}
			<div className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-background shadow-xl transition-transform">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border px-6 py-4">
					<div className="flex items-center gap-3 min-w-0">
						{engine.image ? (
							<img
								src={engine.image}
								alt={engine.name}
								className="size-10 shrink-0 rounded-lg object-contain"
							/>
						) : (
							<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
								<Cpu className="size-5" />
							</div>
						)}
						<div className="min-w-0">
							<h2 className="truncate text-lg font-semibold">{engine.name}</h2>
							<div className="flex items-center gap-2">
								{engine.version && (
									<span className="text-sm text-muted-foreground/500">
										v{engine.version}
									</span>
								)}
								{engine.isActive && (
									<Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
										<Check className="size-3" />
										Active
									</Badge>
								)}
							</div>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
						aria-label="Close"
					>
						<X className="size-5" />
					</button>
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
					{/* Health Status */}
					<Section title="Status">
						{healthLoading ? (
							<div className="flex items-center gap-2 text-sm text-muted-foreground/500">
								<Loader2 className="size-4 animate-spin" />
								Checking engine…
							</div>
						) : health ? (
							<HealthStatus health={health} />
						) : (
							<p className="text-sm text-muted-foreground/500">Unknown</p>
						)}
					</Section>

					{/* Binary Path */}
					<Section title="Binary Path">
						{engine.path ? (
							<div className="flex items-start gap-2">
								<FolderOpen className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
								<code className="break-all font-mono text-xs text-foreground bg-muted/50 rounded px-2 py-1">
									{engine.path}
								</code>
							</div>
						) : (
							<p className="text-sm text-muted-foreground/500">No path configured</p>
						)}
						<div className="mt-2 flex items-center gap-2">
							<Dot tone={engine.exists ? "ok" : "warn"} />
							<span className="text-sm text-muted-foreground">
								{engine.exists ? "Binary found on disk" : "Binary NOT found on disk"}
							</span>
						</div>
					</Section>

					{/* Stats */}
					<Section title="Details">
						<div className="grid grid-cols-2 gap-3">
							<DetailCard label="ELO" value={engine.elo ? String(engine.elo) : "—"} />
							<DetailCard
								label="Type"
								value={engine.path?.endsWith(".exe") ? "Windows" : "Native"}
							/>
							<DetailCard
								label="Added"
								value={new Date(engine.createdAt).toLocaleDateString()}
							/>
							<DetailCard
								label="Updated"
								value={new Date(engine.updatedAt).toLocaleDateString()}
							/>
						</div>
					</Section>

					{/* UCI Options */}
					<Section title="UCI Options">
						{engine.options && engine.options.length > 0 ? (
							<div className="space-y-1.5">
								{engine.options.map((opt) => (
									<div
										key={opt.name}
										className="flex items-center justify-between rounded bg-muted/50 px-2 py-1.5"
									>
										<span className="text-xs font-medium text-foreground">
											{opt.name}
										</span>
										<span className="font-mono text-xs text-muted-foreground/500">
											{opt.type}
											{opt.default != null && ` (default: ${opt.default})`}
										</span>
									</div>
								))}
							</div>
						) : (
							<div className="flex items-center gap-2 text-sm text-muted-foreground/500">
								<Settings2 className="size-4" />
								No options loaded. Options are fetched when the engine is validated.
							</div>
						)}
					</Section>
				</div>
			</div>
		</>
	);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<h3 className="mb-2 text-sm font-medium text-foreground">{title}</h3>
			{children}
		</div>
	);
}

function HealthStatus({ health }: { health: EngineHealthDTO }) {
	const statusConfig: Record<
		EngineHealthDTO["status"],
		{ icon: React.ReactNode; tone: string; label: string }
	> = {
		ok: {
			icon: <CircleCheck className="size-4 text-emerald-600" />,
			tone: "text-emerald-700",
			label: "Operational",
		},
		no_active_engine: {
			icon: <CircleX className="size-4 text-amber-500" />,
			tone: "text-amber-700",
			label: "No active engine",
		},
		no_path: {
			icon: <CircleX className="size-4 text-amber-500" />,
			tone: "text-amber-700",
			label: "No path configured",
		},
		missing: {
			icon: <CircleX className="size-4 text-destructive" />,
			tone: "text-destructive",
			label: "Binary missing",
		},
		not_executable: {
			icon: <CircleX className="size-4 text-destructive" />,
			tone: "text-destructive",
			label: "Not executable",
		},
		spawn_failed: {
			icon: <CircleX className="size-4 text-destructive" />,
			tone: "text-destructive",
			label: "Failed to start",
		},
		error: {
			icon: <CircleX className="size-4 text-destructive" />,
			tone: "text-destructive",
			label: "Error",
		},
	};

	const config = statusConfig[health.status];

	return (
		<div className="space-y-1">
			<div className={`flex items-center gap-2 text-sm font-medium ${config.tone}`}>
				{config.icon}
				{config.label}
			</div>
			<p className="text-xs text-muted-foreground/500">{health.message}</p>
		</div>
	);
}

function DetailCard({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-md bg-muted/50 px-2.5 py-2">
			<div className="text-[10px] uppercase tracking-wide text-muted-foreground">
				{label}
			</div>
			<div className="font-mono text-xs font-medium text-foreground">{value}</div>
		</div>
	);
}

function Dot({ tone }: { tone: "ok" | "warn" }) {
	return (
		<span
			className={`inline-block size-2 rounded-full ${
				tone === "ok" ? "bg-emerald-500" : "bg-destructive"
			}`}
		/>
	);
}
