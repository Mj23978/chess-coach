import type { JSX } from "react";
import type { MosaicNode } from "react-mosaic-component";

export const MOSAIC_PORTAL_IDS = {
  BOARD: "board",
  ENGINE: "engine",
  MOVES: "moves",
  TRAINING: "training",
} as const;

export type WorkbenchPanel =
  | "board"
  | "moves"
  | "engine"
  | "evaluation"
  | "database"
  | "openingExplorer"
  | "repertoire"
  | "notes"
  | "training"
  | "searchResults"
  | "gamePreview";

export type ViewId = WorkbenchPanel;

export type WorkspaceMode = "analysis" | "opening" | "training" | "database" | "play";

export const MOSAIC_PANE_CONSTRAINTS = {
  MINIMUM_PERCENTAGE: 20,
  MAXIMUM_PERCENTAGE: 50,
  DEFAULT_SPLIT_PERCENTAGE: 50,
} as const;

export const MOSAIC_RIGHT_COLUMN_SPLIT = 55;

export const MAX_TABS = 10;

export const DROPPABLE_IDS = {
  TABS: "droppable",
  ENGINES: "engines-droppable",
} as const;

export const SCROLL_AREA_CONFIG = {
  SCROLLBAR_SIZE: 8,
} as const;

export const STORAGE_KEYS = {
  WORKSPACE_LAYOUTS: "workbench.workspaceLayouts",
} as const;

export const DEFAULT_MOSAIC_LAYOUT: MosaicNode<ViewId> = {
  type: "split",
  direction: "row",
  children: [
    MOSAIC_PORTAL_IDS.BOARD as ViewId,
    {
      type: "split",
      direction: "column",
      children: [MOSAIC_PORTAL_IDS.ENGINE as ViewId, MOSAIC_PORTAL_IDS.MOVES as ViewId],
      splitPercentages: [MOSAIC_RIGHT_COLUMN_SPLIT, 100 - MOSAIC_RIGHT_COLUMN_SPLIT],
    },
  ],
  splitPercentages: [50, 50],
};

export const TRAINING_MOSAIC_LAYOUT: MosaicNode<ViewId> = {
  type: "split",
  direction: "row",
  children: [
    MOSAIC_PORTAL_IDS.BOARD as ViewId,
    {
      type: "split",
      direction: "column",
      children: [MOSAIC_PORTAL_IDS.TRAINING as ViewId, MOSAIC_PORTAL_IDS.MOVES as ViewId],
      splitPercentages: [MOSAIC_RIGHT_COLUMN_SPLIT, 100 - MOSAIC_RIGHT_COLUMN_SPLIT],
    },
  ],
  splitPercentages: [50, 50],
};

const LEGACY_PANEL_IDS: Record<string, ViewId> = {
  left: MOSAIC_PORTAL_IDS.BOARD,
  topRight: MOSAIC_PORTAL_IDS.ENGINE,
  bottomRight: MOSAIC_PORTAL_IDS.MOVES,
};

const VALID_PANEL_IDS = new Set<ViewId>([
  "board",
  "moves",
  "engine",
  "evaluation",
  "database",
  "openingExplorer",
  "repertoire",
  "notes",
  "training",
  "searchResults",
  "gamePreview",
]);

function normalizePanelId(value: string): ViewId | null {
  const migrated = LEGACY_PANEL_IDS[value] ?? value;
  return VALID_PANEL_IDS.has(migrated as ViewId) ? (migrated as ViewId) : null;
}

export function normalizeMosaicLayout(
  layout: MosaicNode<ViewId> | MosaicNode<string> | null | undefined,
  fallback: MosaicNode<ViewId>,
): MosaicNode<ViewId> {
  if (!layout) return fallback;

  if (typeof layout === "string") {
    return normalizePanelId(layout) ?? fallback;
  }

  if (layout.type !== "split" || !Array.isArray(layout.children) || layout.children.length !== 2) {
    return fallback;
  }

  const firstChild = normalizeMosaicLayout(layout.children[0], fallback);
  const secondChild = normalizeMosaicLayout(layout.children[1], fallback);

  return {
    ...layout,
    children: [firstChild, secondChild],
  };
}

export const CUSTOM_EVENTS = {
  ENGINE_REORDER: "engineReorder",
  WORKSPACE_RESET_LAYOUT: "workspaceResetLayout",
  BOARD_SAVE: "boardSave",
  BOARD_COPY_FEN: "boardCopyFen",
  BOARD_COPY_PGN: "boardCopyPgn",
  BOARD_FLIP: "boardFlip",
  BOARD_CLEAR_ANNOTATIONS: "boardClearAnnotations",
  BOARD_SETUP_POSITION: "boardSetupPosition",
  BOARD_SNAPSHOT: "boardSnapshot",
  BOARD_TOGGLE_ENGINE: "boardToggleEngine",
  BOARD_STOP_ENGINE: "boardStopEngine",
} as const;

export const REPORT_ID_PREFIX = "report_";

export function createFullLayout(): { [viewId: string]: JSX.Element } {
  return {
    [MOSAIC_PORTAL_IDS.BOARD]: (
      <div id={MOSAIC_PORTAL_IDS.BOARD} tabIndex={-1} style={{ height: "100%" }} />
    ),
    [MOSAIC_PORTAL_IDS.ENGINE]: (
      <div id={MOSAIC_PORTAL_IDS.ENGINE} tabIndex={-1} style={{ height: "100%" }} />
    ),
    [MOSAIC_PORTAL_IDS.MOVES]: (
      <div id={MOSAIC_PORTAL_IDS.MOVES} tabIndex={-1} style={{ height: "100%" }} />
    ),
    [MOSAIC_PORTAL_IDS.TRAINING]: (
      <div id={MOSAIC_PORTAL_IDS.TRAINING} tabIndex={-1} style={{ height: "100%" }} />
    ),
  };
}

export function constrainSplitPercentage(splitPercentage?: number): number {
  const value = splitPercentage ?? MOSAIC_PANE_CONSTRAINTS.DEFAULT_SPLIT_PERCENTAGE;

  return Math.max(
    MOSAIC_PANE_CONSTRAINTS.MINIMUM_PERCENTAGE,
    Math.min(MOSAIC_PANE_CONSTRAINTS.MAXIMUM_PERCENTAGE, value),
  );
}
