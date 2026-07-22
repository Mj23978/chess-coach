/**
 * Root SPA router. One route today (`/` → Dashboard); add game review, play,
 * repertoire, etc. as the app grows.
 */
import { Routes, Route } from "react-router-dom";
import { DesignSystemProvider } from "@repo/ui";
import DashboardPage from "./pages/dashboard";

export default function App() {
  return (
    <DesignSystemProvider>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
      </Routes>
    </DesignSystemProvider>
  );
}
