/**
 * Settings page — engine management and app configuration.
 *
 * Tabs:
 *  - Engines: list configured engines, download from catalog, add local path
 *  - About: app info, version
 *
 * This is the primary UI for engine management in chess-coach.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import {
  fetchEngines,
  fetchEngineCatalog,
  downloadEngine,
  addLocalEngine,
  activateEngine,
  deleteEngine,
  type EngineDTO,
  type CatalogEngineDTO,
} from "../lib/api";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"engines" | "about">("engines");

  return (
    <div className="mx-auto max-w-3xl p-8">
      <header className="mb-6">
        <Link to="/" className="text-xs text-blue-600">
          ← Dashboard
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Settings</h1>
      </header>

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab("engines")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "engines"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Engines
        </button>
        <button
          onClick={() => setActiveTab("about")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "about"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          About
        </button>
      </div>

      {activeTab === "engines" && <EnginesTab />}
      {activeTab === "about" && <AboutTab />}
    </div>
  );
}

function EnginesTab() {
  const qc = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Configured engines */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Configured Engines</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCatalogModal(true)}>
              Download Engine
            </Button>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              Add Local Engine
            </Button>
          </div>
        </div>

        {isLoading && <p className="text-neutral-500">Loading engines…</p>}

        {engines?.length === 0 && (
          <p className="text-neutral-500">
            No engines configured. Download Stockfish or add a local engine to enable analysis.
          </p>
        )}

        <div className="space-y-3">
          {engines?.map((engine) => (
            <EngineCard
              key={engine.id}
              engine={engine}
              onActivate={() => activateMut.mutate(engine.id)}
              onDelete={() => deleteMut.mutate(engine.id)}
              isActivating={activateMut.isPending}
              isDeleting={deleteMut.isPending}
            />
          ))}
        </div>
      </section>

      {/* Modals */}
      {showCatalogModal && (
        <CatalogModal
          onClose={() => setShowCatalogModal(false)}
          onSuccess={() => {
            setShowCatalogModal(false);
            qc.invalidateQueries({ queryKey: ["engines"] });
          }}
        />
      )}

      {showAddModal && (
        <AddEngineModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            qc.invalidateQueries({ queryKey: ["engines"] });
          }}
        />
      )}
    </div>
  );
}

function EngineCard({
  engine,
  onActivate,
  onDelete,
  isActivating,
  isDeleting,
}: {
  engine: EngineDTO;
  onActivate: () => void;
  onDelete: () => void;
  isActivating: boolean;
  isDeleting: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          {engine.image && (
            <img
              src={engine.image}
              alt={engine.name}
              className="h-10 w-10 rounded object-contain"
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{engine.name}</span>
              {engine.version && (
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600">
                  v{engine.version}
                </span>
              )}
              {engine.isActive && (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">
                  Active
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500">
              {engine.elo && <span>ELO: {engine.elo}</span>}
              {!engine.exists && engine.path && (
                <span className="text-red-600">⚠ File not found</span>
              )}
              {!engine.path && <span className="text-neutral-400">No path set</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!engine.isActive && engine.exists && (
            <Button
              variant="outline"
              size="sm"
              onClick={onActivate}
              disabled={isActivating}
            >
              {isActivating ? "Activating…" : "Activate"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
            className="text-red-600 hover:bg-red-50"
          >
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CatalogModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: catalog, isLoading, error } = useQuery({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Download Engine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <p className="text-neutral-500">Loading catalog…</p>}
          {error && (
            <p className="text-red-600">Failed to load catalog: {String(error)}</p>
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
                      {engine.image && (
                        <img
                          src={engine.image}
                          alt={engine.name}
                          className="h-8 w-8 rounded object-contain"
                        />
                      )}
                      <div>
                        <div className="font-medium">{engine.name} {engine.version}</div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add Local Engine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Engine Path</label>
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
            <label className="mb-1 block text-sm font-medium">Display Name (optional)</label>
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
              {addMut.error instanceof Error ? addMut.error.message : "Failed to add engine"}
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

function AboutTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Chess Coach</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Version:</span> 0.1.0
          </p>
          <p className="text-neutral-600">
            A desktop chess coach app: analyze your games, play against the engine,
            and improve your chess.
          </p>
          <p className="text-neutral-600">
            Built with Electrobun, React, and Stockfish.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
