/**
 * Barrel for dashboard subcomponents.
 *
 * The dashboard page (`pages/dashboard.tsx`) imports only from here so the
 * individual components stay swappable and the import surface is small.
 */

export { ConnectedAccountsCard } from "./ConnectedAccountsCard";
export { DailyGoalsCard } from "./DailyGoalsCard";
export type { GamesTableProps } from "./GamesTable";
export { GamesTable } from "./GamesTable";
export type { TimeControl } from "./TimeControlGrid";
export { TimeControlGrid } from "./TimeControlGrid";
export { TrainingSuggestionsCard } from "./TrainingSuggestionsCard";
export { WelcomeCard } from "./WelcomeCard";
