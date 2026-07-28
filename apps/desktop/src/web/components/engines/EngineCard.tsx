/**
 * EngineCard (Phase 7) — one engine in the grid / list.
 *
 * Mirrors the DatabaseCard pattern: a presentational component driven entirely
 * by props. Two layouts:
 *  - `grid`: a square card with engine image/avatar, name, version, and a
 *    status row (active badge / ELO / activate / delete buttons).
 *  - `list`: a compact single row with the same data laid out inline.
 *
 * Used by `pages/engines.tsx`. The card surfaces:
 *  - Activate (sets the engine as the analysis/play default)
 *  - Delete (removes the config; underlying binary is left on disk)
 */
import { Cpu, Check, Trash2, Power, Loader2 } from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import type { EngineDTO } from "../../lib/api";

export interface EngineCardProps {
	engine: EngineDTO;
	/** Grid (default) or list layout. */
	view?: "grid" | "list";
	/** Set this engine as the active analysis/play engine. */
	onActivate: () => void;
	/** Remove the engine config (binary on disk is left alone). */
	onDelete: () => void;
	/** Show the engine detail sheet. */
	onShowDetails?: () => void;
	/** Mutation in-flight flags from the parent (for button spinners). */
	isActivating?: boolean;
	isDeleting?: boolean;
}

export function EngineCard({
	engine,
	view = "grid",
	onActivate,
	onDelete,
	onShowDetails,
	isActivating = false,
	isDeleting = false,
}: EngineCardProps) {
	if (view === "list") {
		return (
			<div>
			<button
				type="button"
				onClick={onShowDetails}
				className="flex w-full items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50"
			>
				<Avatar engine={engine} size="sm" />
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className="truncate font-medium">{engine.name}</span>
						{engine.version && (
							<span className="text-xs text-neutral-400">v{engine.version}</span>
						)}
						{engine.isActive && <ActiveBadge />}
					</div>
					<div className="font-mono text-[11px] text-neutral-500">
						{engine.elo ? `${engine.elo} ELO` : "ELO unknown"}
						{!engine.exists && " · missing binary"}
					</div>
				</div>
				<Actions
					engine={engine}
					onActivate={onActivate}
					onDelete={onDelete}
					isActivating={isActivating}
					isDeleting={isDeleting}
					onStopPropagation
				/>
			</button>
				<Avatar engine={engine} size="sm" />
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className="truncate font-medium">{engine.name}</span>
						{engine.version && (
							<span className="text-xs text-neutral-400">v{engine.version}</span>
						)}
						{engine.isActive && <ActiveBadge />}
					</div>
					<div className="font-mono text-[11px] text-neutral-500">
						{engine.elo ? `${engine.elo} ELO` : "ELO unknown"}
						{!engine.exists && " · missing binary"}
					</div>
				</div>
				<Actions
					engine={engine}
					onActivate={onActivate}
					onDelete={onDelete}
					isActivating={isActivating}
					isDeleting={isDeleting}
				/>
			</div>
		);
	}

	// Grid variant
	return (
		<button
			type="button"
			onClick={onShowDetails}
			className="flex flex-col rounded-xl border border-neutral-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
		>
			<div className="mb-3 flex items-start gap-3">
				<Avatar engine={engine} size="lg" />
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<h3 className="truncate font-semibold">{engine.name}</h3>
						{engine.isActive && <ActiveBadge />}
					</div>
					{engine.version && (
						<p className="text-xs text-neutral-400">Version {engine.version}</p>
					)}
				</div>
			</div>

			<div className="mb-3 grid grid-cols-2 gap-2 text-xs">
				<Stat label="Strength" value={engine.elo ? `${engine.elo} ELO` : "—"} />
				<Stat
					label="Binary"
					value={engine.exists ? "Available" : "Missing"}
					tone={engine.exists ? "ok" : "warn"}
				/>
			</div>

			<div className="mt-auto pt-2">
				<Actions
					engine={engine}
					onActivate={onActivate}
					onDelete={onDelete}
					isActivating={isActivating}
					isDeleting={isDeleting}
					onStopPropagation
					stacked
				/>
			</div>
		</button>
	);
}

// ---------------------------------------------------------------------------

/** Engine image if catalog-supplied, else a neutral Cpu avatar. */
function Avatar({
	engine,
	size,
}: {
	engine: EngineDTO;
	size: "sm" | "lg";
}) {
	const dim = size === "lg" ? "size-11" : "size-9";
	const icon = size === "lg" ? "size-5" : "size-4";
	if (engine.image) {
		return (
			<img
				src={engine.image}
				alt={engine.name}
				className={`${dim} shrink-0 rounded-lg object-contain`}
			/>
		);
	}
	return (
		<div
			className={`flex ${dim} shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600`}
		>
			<Cpu className={icon} />
		</div>
	);
}

function ActiveBadge() {
	return (
		<Badge className="shrink-0 gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
			<Check className="size-3" />
			Active
		</Badge>
	);
}

function Stat({
	label,
	value,
	tone = "default",
}: {
	label: string;
	value: string;
	tone?: "default" | "ok" | "warn";
}) {
	const valueTone =
		tone === "ok"
			? "text-emerald-700"
			: tone === "warn"
				? "text-red-600"
				: "text-neutral-700";
	return (
		<div className="rounded-md bg-neutral-50 px-2 py-1.5">
			<div className="text-[10px] uppercase tracking-wide text-neutral-400">
				{label}
			</div>
			<div className={`font-mono text-xs font-medium ${valueTone}`}>{value}</div>
		</div>
	);
}

/** The activate + delete affordances. */
function Actions({
	engine,
	onActivate,
	onDelete,
	isActivating,
	isDeleting,
	onStopPropagation,
	stacked = false,
}: {
	engine: EngineDTO;
	onActivate: () => void;
	onDelete: () => void;
	isActivating: boolean;
	isDeleting: boolean;
	onStopPropagation?: boolean;
	stacked?: boolean;
}) {
	return (
		<div
			className={`flex ${stacked ? "flex-col gap-1.5" : "items-center gap-1"} justify-end`}
			onClick={(e) => onStopPropagation && e.stopPropagation()}
		>
			<Button
				variant={engine.isActive ? "outline" : "default"}
				size="sm"
				onClick={onActivate}
				disabled={engine.isActive || isActivating}
				className={stacked ? "w-full justify-center" : ""}
			>
				{isActivating ? (
					<Loader2 className="mr-1.5 size-3.5 animate-spin" />
				) : engine.isActive ? (
					<Check className="mr-1.5 size-3.5" />
				) : (
					<Power className="mr-1.5 size-3.5" />
				)}
				{engine.isActive ? "Active" : "Activate"}
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onClick={onDelete}
				disabled={isDeleting}
				className={`text-neutral-400 hover:text-red-600 ${stacked ? "w-full justify-center" : ""}`}
				aria-label={`Remove ${engine.name}`}
			>
				{isDeleting ? (
					<Loader2 className="size-3.5 animate-spin" />
				) : (
					<Trash2 className="size-3.5" />
				)}
				{stacked && <span className="ml-1.5">Remove</span>}
			</Button>
		</div>
	);
}
