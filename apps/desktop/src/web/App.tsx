/**
 * Root SPA router.
 *
 * Routes:
 *   `/`             → Dashboard (game list + Import PGN)
 *   `/games/:id`    → Game Review (board, move list, eval bar, badges)
 *   `/board`        → Board (play, analysis, FEN entry)
 *   `/engines`      → Engines (engine management)
 *   `/databases`    → Databases (game collections)
 *   `/files`        → Files (PGN import, repertoires)
 *   `/accounts`     → Accounts (Chess.com/Lichess sync)
 *   `/train`        → Train (puzzles, training modes)
 *   `/settings`     → Settings (app configuration)
 *
 * All routes are wrapped in AppShell for consistent layout.
 */
import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { DesignSystemProvider } from "@repo/ui";
import { AppShell } from "./components/layout";
import DashboardPage from "./pages/dashboard";
import GameReviewPage from "./pages/game-review";
import SettingsPage from "./pages/settings";
import BoardPage from "./pages/board";
import EnginesPage from "./pages/engines";
import DatabasesPage from "./pages/databases";
import FilesPage from "./pages/files";
import AccountsPage from "./pages/accounts";
import TrainPage from "./pages/train";
import { ImportPgnModal } from "./components/import-pgn-modal";

export default function App() {
	const [importModalOpen, setImportModalOpen] = useState(false);
	const qc = useQueryClient();

	return (
		<DesignSystemProvider>
			<AppShell onImportPgn={() => setImportModalOpen(true)}>
				<Routes>
					<Route
						path="/"
						element={
							<DashboardPage onImportPgn={() => setImportModalOpen(true)} />
						}
					/>
					<Route path="/games/:id" element={<GameReviewPage />} />
					<Route path="/board" element={<BoardPage />} />
					<Route path="/engines" element={<EnginesPage />} />
					<Route path="/databases" element={<DatabasesPage />} />
					<Route path="/files" element={<FilesPage />} />
					<Route path="/accounts" element={<AccountsPage />} />
					<Route path="/train" element={<TrainPage />} />
					<Route path="/settings" element={<SettingsPage />} />
				</Routes>
			</AppShell>

			{importModalOpen && (
				<ImportPgnModal
					onClose={() => setImportModalOpen(false)}
					onCreated={() => {
						setImportModalOpen(false);
						// Refresh the dashboard's game list after a successful import.
						qc.invalidateQueries({ queryKey: ["games"] });
					}}
				/>
			)}
		</DesignSystemProvider>
	);
}
