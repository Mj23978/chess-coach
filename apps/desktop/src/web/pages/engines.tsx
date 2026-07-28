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
	EngineCard,
	EngineDetailSheet,
} from "../components/engines";
import { PageContainer, PageHeader } from "../components/layout";
import { ViewToggle, ErrorState } from "../components/ui";
import {
	fetchEngines,
	fetchEngineCatalog,
	downloadEngine,
	addLocalEngine,
	activateEngine,
	deleteEngine,
	type EngineDTO,
} from "../lib/api";
import { ModalShell } from "../components/ui/modal-shell";

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
		<PageContainer>
			<PageHeader
				title="Engines"
				subtitle="Manage your chess engines for analysis and play."
				icon={<Cpu className="size-5" />}
				actions={
					<>
						<div className="relative w-56">
							<Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
					</>
				}
			/>

			{/* View toggle + count */}
			<div className="mb-4 flex items-center justify-between">
				<div className="flex gap-1 rounded-lg border border-border p-1">
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
				<span className="text-sm text-muted-foreground">
					{visible.length} engine{visible.length === 1 ? "" : "s"}
					{search && engines && visible.length !== engines.length && (
						<> of {engines.length}</>
					)}
				</span>
			</div>

			{/* Loading */}
			{isLoading && (
				<p className="py-12 text-center text-sm text-muted-foreground">
					Loading engines…
				</p>
			)}

			{/* Empty state */}
			{!isLoading && visible.length === 0 && (
				<div className="rounded-xl border border-dashed border-border p-12 text-center">
					<Cpu className="mx-auto mb-4 size-12 text-muted-foreground/50" />
					<h3 className="mb-2 font-medium text-foreground">
						{engines && engines.length > 0
							? "No engines match your search"
							: "No engines configured"}
					</h3>
					<p className="mb-4 text-sm text-muted-foreground">
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
		</PageContainer>
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
		<ModalShell
			open
			onOpenChange={(open) => !open && onClose()}
			title="Download Engine"
			className="max-w-md"
		>
					{isLoading && <p className="text-muted-foreground">Loading catalog…</p>}
					{error && (
						<p className="text-sm text-destructive">
							{error instanceof Error ? error.message : "Couldn't load the engine catalog."}
						</p>
					)}

					{catalog && (
						<>
							<p className="text-sm text-muted-foreground">
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
												<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
													<Cpu className="size-5" />
												</div>
											)}
											<div>
												<div className="font-medium">
													{engine.name} {engine.version}
												</div>
												<div className="text-xs text-muted-foreground">
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
						<p className="text-destructive">
							{downloadMut.error instanceof Error
								? downloadMut.error.message
								: "Download failed"}
						</p>
					)}

			</ModalShell>
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
		<ModalShell
			open
			onOpenChange={(open) => !open && onClose()}
			title="Add Local Engine"
			className="max-w-md"
		>
					<div>
						<label className="mb-1 block text-sm font-medium">
							Engine Path
						</label>
						<input
							type="text"
							value={path}
							onChange={(e) => setPath(e.target.value)}
							placeholder="C:\path\to\stockfish.exe"
							className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
						/>
						<p className="mt-1 text-xs text-muted-foreground">
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
							className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
						/>
					</div>

					{addMut.isError && (
						<p className="text-sm text-destructive">
							{addMut.error instanceof Error
								? addMut.error.message
								: "Failed to add engine. Please check the path and try again."}
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
			</ModalShell>
	);
}
