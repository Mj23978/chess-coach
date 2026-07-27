/**
 * EngineDetailSheet — slide-over panel showing engine details.
 *
 * Shows the engine's binary path, existence status, UCI options, and a live
 * health check result. Opened when clicking on an EngineCard.
 */
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

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-50 bg-black/30 transition-opacity"
				onClick={onClose}
				onKeyDown={(e) => e.key === "Escape" && onClose()}
			/>
			{/* Sheet */}
			<div className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-lg flex-col border-l border-neutral-200 bg-white shadow-xl transition-transform">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
					<div className="flex items-center gap-3 min-w-0">
						{engine.image ? (
							<img
								src={engine.image}
								alt={engine.name}
								className="size-10 shrink-0 rounded-lg object-contain"
							/>
						) : (
							<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
								<Cpu className="size-5" />
							</div>
						)}
						<div className="min-w-0">
							<h2 className="truncate text-lg font-semibold">{engine.name}</h2>
							<div className="flex items-center gap-2">
								{engine.version && (
									<span className="text-sm text-neutral-500">
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
						className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
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
							<div className="flex items-center gap-2 text-sm text-neutral-500">
								<Loader2 className="size-4 animate-spin" />
								Checking engine…
							</div>
						) : health ? (
							<HealthStatus health={health} />
						) : (
							<p className="text-sm text-neutral-500">Unknown</p>
						)}
					</Section>

					{/* Binary Path */}
					<Section title="Binary Path">
						{engine.path ? (
							<div className="flex items-start gap-2">
								<FolderOpen className="mt-0.5 size-4 shrink-0 text-neutral-400" />
								<code className="break-all font-mono text-xs text-neutral-700 bg-neutral-50 rounded px-2 py-1">
									{engine.path}
								</code>
							</div>
						) : (
							<p className="text-sm text-neutral-500">No path configured</p>
						)}
						<div className="mt-2 flex items-center gap-2">
							<Dot tone={engine.exists ? "ok" : "warn"} />
							<span className="text-sm text-neutral-600">
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
										className="flex items-center justify-between rounded bg-neutral-50 px-2 py-1.5"
									>
										<span className="text-xs font-medium text-neutral-700">
											{opt.name}
										</span>
										<span className="font-mono text-xs text-neutral-500">
											{opt.type}
											{opt.default != null && ` (default: ${opt.default})`}
										</span>
									</div>
								))}
							</div>
						) : (
							<div className="flex items-center gap-2 text-sm text-neutral-500">
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
			<h3 className="mb-2 text-sm font-medium text-neutral-900">{title}</h3>
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
			icon: <CircleX className="size-4 text-red-500" />,
			tone: "text-red-700",
			label: "Binary missing",
		},
		not_executable: {
			icon: <CircleX className="size-4 text-red-500" />,
			tone: "text-red-700",
			label: "Not executable",
		},
		spawn_failed: {
			icon: <CircleX className="size-4 text-red-500" />,
			tone: "text-red-700",
			label: "Failed to start",
		},
		error: {
			icon: <CircleX className="size-4 text-red-500" />,
			tone: "text-red-700",
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
			<p className="text-xs text-neutral-500">{health.message}</p>
		</div>
	);
}

function DetailCard({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-md bg-neutral-50 px-2.5 py-2">
			<div className="text-[10px] uppercase tracking-wide text-neutral-400">
				{label}
			</div>
			<div className="font-mono text-xs font-medium text-neutral-700">{value}</div>
		</div>
	);
}

function Dot({ tone }: { tone: "ok" | "warn" }) {
	return (
		<span
			className={`inline-block size-2 rounded-full ${
				tone === "ok" ? "bg-emerald-500" : "bg-red-500"
			}`}
		/>
	);
}
