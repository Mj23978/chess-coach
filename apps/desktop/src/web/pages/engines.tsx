/**
 * Engines page — `/engines` (Phase 7: E1-001 … E1-006).
 *
 * Engine management UI. Moved from Settings page to its own dedicated page.
 * Features search, grid/list view toggle, improved card styling, and engine
 * images.
 *
 * Data flow:
 *  - `useQuery(["engines"])` is the single source of truth.
 *  - Mutations (activate, delete, download, add) invalidate `["engines"]`.
 */
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Cpu, Plus, Search } from "lucide-react";
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import {
	EngineCard,
	EngineDetailSheet,
} from "../components/engines";
import {
	fetchEngines,
	fetchEngineCatalog,
	downloadEngine,
	addLocalEngine,
	activateEngine,
	deleteEngine,
	type EngineDTO,
} from "../lib/api";

type ViewMode = "grid" | "list";

export default function EnginesPage() {
	const qc = useQueryClient();
	const [showAddModal, setShowAddModal] = useState(false);
	const [showCatalogModal, setShowCatalogModal] = useState(false);
	const [detailEngine, setDetailEngine] = useState<EngineDTO | null>(null);

	// Search + view state
	const [view, setView] = useState<ViewMode>("grid");
	const [search, setSearch] = useState("");

	const { data: engines, isLoading } = useQuery({
		queryKey: ["engines"],
		queryFn: fetchEngines,
	});

	const activateMut = useMutation({
		mutationFn: activateEngine,
		onSuccess: () => qc.invalidateQueries({ queryKey: ["engines"] }),
	});

	const deleteMut = useMutation({
		mutationFn: deleteEngine,
		onSuccess: () => qc.invalidateQueries({ queryKey: ["engines"] }),
	});

	// Filtered list
	const visible = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return engines ?? [];
		return (engines ?? []).filter(
			(e) =>
				e.name.toLowerCase().includes(q) ||
				(e.version ?? "").toLowerCase().includes(q),
		);
	}, [engines, search]);

	function handleDelete(engine: EngineDTO) {
		if (
			confirm(
				`Remove "${engine.name}"? The engine binary on disk is not deleted.`,
			)
		) {
			deleteMut.mutate(engine.id);
		}
	}

	return (
		<div className="mx-auto max-w-6xl p-8">
			{/* Header */}
			<header className="mb-6">
				<div className="flex items-start justify-between gap-4">
					<div className="min-w-0">
						<div className="mt-1 flex items-center gap-3">
							<div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
								<Cpu className="size-5" />
							</div>
							<div className="min-w-0">
								<h1 className="truncate text-2xl font-bold">Engines</h1>
								<p className="mt-0.5 text-sm text-neutral-500">
									Manage your chess engines for analysis and play.
								</p>
							</div>
						</div>
					</div>

					<div className="flex shrink-0 items-center gap-2">
						<div className="relative w-56">
							<Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
							<Input
								variant="minimal"
								placeholder="Search engines…"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="h-9 pl-8"
							/>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowCatalogModal(true)}
						>
							Download Engine
						</Button>
						<Button size="sm" onClick={() => setShowAddModal(true)}>
							<Plus className="mr-1.5 size-4" />
							Add Engine
						</Button>
					</div>
				</div>
			</header>

			{/* View toggle + count */}
			<div className="mb-4 flex items-center justify-between">
				<div className="flex gap-1 rounded-lg border border-neutral-200 p-1">
					<ViewToggle
						mode="grid"
						active={view === "grid"}
						onClick={() => setView("grid")}
					/>
					<ViewToggle
						mode="list"
						active={view === "list"}
						onClick={() => setView("list")}
					/>
				</div>
				<span className="text-sm text-neutral-500">
					{visible.length} engine{visible.length === 1 ? "" : "s"}
					{search && engines && visible.length !== engines.length && (
						<> of {engines.length}</>
					)}
				</span>
			</div>

			{/* Loading */}
			{isLoading && (
				<p className="py-12 text-center text-sm text-neutral-500">
					Loading engines…
				</p>
			)}

			{/* Empty state */}
			{!isLoading && visible.length === 0 && (
				<div className="rounded-xl border border-dashed border-neutral-300 p-12 text-center">
					<Cpu className="mx-auto mb-4 size-12 text-neutral-300" />
					<h3 className="mb-2 font-medium text-neutral-700">
						{engines && engines.length > 0
							? "No engines match your search"
							: "No engines configured"}
					</h3>
					<p className="mb-4 text-sm text-neutral-500">
						{engines && engines.length > 0
							? "Try a different search term."
							: "Download Stockfish or add a local engine to enable analysis."}
					</p>
					{!engines || engines.length === 0 ? (
						<div className="flex justify-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowCatalogModal(true)}
							>
								Download Engine
							</Button>
							<Button size="sm" onClick={() => setShowAddModal(true)}>
								<Plus className="mr-1.5 size-4" />
								Add Engine
							</Button>
						</div>
					) : null}
				</div>
			)}

			{/* Grid */}
			{view === "grid" && visible.length > 0 && (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{visible.map((engine) => (
						<EngineCard
							key={engine.id}
							engine={engine}
							view="grid"
							onActivate={() => activateMut.mutate(engine.id)}
							onDelete={() => handleDelete(engine)}
							onShowDetails={() => setDetailEngine(engine)}
							isActivating={activateMut.isPending}
							isDeleting={deleteMut.isPending}
						/>
					))}
				</div>
			)}

			{/* List */}
			{view === "list" && visible.length > 0 && (
				<div className="space-y-2">
					{visible.map((engine) => (
						<EngineCard
							key={engine.id}
							engine={engine}
							view="list"
							onActivate={() => activateMut.mutate(engine.id)}
							onDelete={() => handleDelete(engine)}
							onShowDetails={() => setDetailEngine(engine)}
							isActivating={activateMut.isPending}
							isDeleting={deleteMut.isPending}
						/>
					))}
				</div>
			)}

			{/* Catalog modal (download) */}
			{showCatalogModal && (
				<CatalogModal
					onClose={() => setShowCatalogModal(false)}
					onSuccess={() => {
						setShowCatalogModal(false);
						qc.invalidateQueries({ queryKey: ["engines"] });
					}}
				/>
			)}

			{/* Add local engine modal */}
			{showAddModal && (
				<AddEngineModal
					onClose={() => setShowAddModal(false)}
					onSuccess={() => {
						setShowAddModal(false);
						qc.invalidateQueries({ queryKey: ["engines"] });
					}}
				/>
			)}

			{/* Engine detail sheet */}
			{detailEngine && (
				<EngineDetailSheet
					engine={detailEngine}
					onClose={() => setDetailEngine(null)}
				/>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// View toggle icons
// ---------------------------------------------------------------------------

function ViewToggle({
	mode,
	active,
	onClick,
}: {
	mode: ViewMode;
	active: boolean;
	onClick: () => void;
}) {
	const Icon = mode === "grid" ? GridIcon : ListIcon;
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex items-center justify-center rounded px-2 py-1 text-sm transition-colors ${
				active
					? "bg-neutral-100 text-neutral-900"
					: "text-neutral-500 hover:bg-neutral-50"
			}`}
			aria-label={`${mode} view`}
			aria-pressed={active}
		>
			<Icon className="size-4" />
		</button>
	);
}

function GridIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<rect x="3" y="3" width="7" height="7" rx="1" />
			<rect x="14" y="3" width="7" height="7" rx="1" />
			<rect x="3" y="14" width="7" height="7" rx="1" />
			<rect x="14" y="14" width="7" height="7" rx="1" />
		</svg>
	);
}

function ListIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<line x1="8" y1="6" x2="21" y2="6" />
			<line x1="8" y1="12" x2="21" y2="12" />
			<line x1="8" y1="18" x2="21" y2="18" />
			<circle cx="3.5" cy="6" r="1" />
			<circle cx="3.5" cy="12" r="1" />
			<circle cx="3.5" cy="18" r="1" />
		</svg>
	);
}

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------

function CatalogModal({
	onClose,
	onSuccess,
}: {
	onClose: () => void;
	onSuccess: () => void;
}) {
	const {
		data: catalog,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["engine-catalog"],
		queryFn: fetchEngineCatalog,
	});

	const downloadMut = useMutation({
		mutationFn: downloadEngine,
		onSuccess,
	});

	const formatBytes = (bytes: number) => {
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			onClick={onClose}
		>
			<Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
				<CardHeader>
					<CardTitle>Download Engine</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{isLoading && <p className="text-neutral-500">Loading catalog…</p>}
					{error && (
						<p className="text-red-600">
							Failed to load catalog: {String(error)}
						</p>
					)}

					{catalog && (
						<>
							<p className="text-sm text-neutral-600">
								Platform: <span className="font-mono">{catalog.platform}</span>
							</p>
							<div className="space-y-2">
								{catalog.engines.map((engine, i) => (
									<div
										key={`${engine.name}-${engine.version}`}
										className="flex items-center justify-between rounded-lg border p-3"
									>
										<div className="flex items-center gap-3">
											{engine.image ? (
												<img
													src={engine.image}
													alt={engine.name}
													className="h-10 w-10 rounded-lg object-contain"
												/>
											) : (
												<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
													<Cpu className="size-5" />
												</div>
											)}
											<div>
												<div className="font-medium">
													{engine.name} {engine.version}
												</div>
												<div className="text-xs text-neutral-500">
													{formatBytes(engine.downloadSize)} · ELO: {engine.elo}
												</div>
											</div>
										</div>
										<Button
											size="sm"
											onClick={() => downloadMut.mutate(i)}
											disabled={downloadMut.isPending}
										>
											{downloadMut.isPending ? "Downloading…" : "Download"}
										</Button>
									</div>
								))}
							</div>
						</>
					)}

					{downloadMut.isError && (
						<p className="text-red-600">
							{downloadMut.error instanceof Error
								? downloadMut.error.message
								: "Download failed"}
						</p>
					)}

					<div className="flex justify-end">
						<Button variant="outline" onClick={onClose}>
							Close
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function AddEngineModal({
	onClose,
	onSuccess,
}: {
	onClose: () => void;
	onSuccess: () => void;
}) {
	const [path, setPath] = useState("");
	const [name, setName] = useState("");

	const addMut = useMutation({
		mutationFn: () => addLocalEngine({ path, name: name || undefined }),
		onSuccess,
	});

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			onClick={onClose}
		>
			<Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
				<CardHeader>
					<CardTitle>Add Local Engine</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<label className="mb-1 block text-sm font-medium">
							Engine Path
						</label>
						<input
							type="text"
							value={path}
							onChange={(e) => setPath(e.target.value)}
							placeholder="C:\path\to\stockfish.exe"
							className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
						/>
						<p className="mt-1 text-xs text-neutral-500">
							Full path to the engine executable (e.g., Stockfish)
						</p>
					</div>

					<div>
						<label className="mb-1 block text-sm font-medium">
							Display Name (optional)
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Stockfish 18"
							className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
						/>
					</div>

					{addMut.isError && (
						<p className="text-red-600">
							{addMut.error instanceof Error
								? addMut.error.message
								: "Failed to add engine"}
						</p>
					)}

					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button
							onClick={() => addMut.mutate()}
							disabled={!path.trim() || addMut.isPending}
						>
							{addMut.isPending ? "Adding…" : "Add Engine"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
