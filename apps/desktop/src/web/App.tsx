/**
 * Root SPA router.
 *   `/`             → Dashboard (game list + Import PGN)
 *   `/games/:id`    → Game Review (board, move list, eval bar, badges)
 *
 * Add play, repertoire, training routes as those features land.
 */
import { Routes, Route } from "react-router-dom";
import { DesignSystemProvider } from "@repo/ui";
import DashboardPage from "./pages/dashboard";
import GameReviewPage from "./pages/game-review";
import SettingsPage from "./pages/settings";

export default function App() {
  return (
    <DesignSystemProvider>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/games/:id" element={<GameReviewPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </DesignSystemProvider>
  );
}
