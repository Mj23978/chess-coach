import { describe, expect, test } from "vitest";
import type { NavigateFn } from "@tanstack/react-router";
import type { TFunction } from "i18next";
import {
  buildAppCommands,
  commandsToMenuGroups,
  commandsToSpotlightActions,
} from "@/app/commands";
import type { KeyDef } from "@/state/keybindings";

const keyMap = new Proxy<Record<string, KeyDef>>(
  {},
  {
    get: (_target, property) => ({
      name: String(property),
      keys: `mod+${String(property).toLowerCase()}`,
    }),
  },
);

const t = ((key: string, fallbackOrOptions?: string | { defaultValue?: string }) => {
  if (typeof fallbackOrOptions === "string") return fallbackOrOptions;
  return fallbackOrOptions?.defaultValue ?? key;
}) as TFunction;
const noop = () => undefined;
const navigate = noop as unknown as NavigateFn;

function buildCommands(overrides: Partial<Parameters<typeof buildAppCommands>[0]> = {}) {
  return buildAppCommands({
    navigate,
    t,
    keyMap,
    hasActiveTab: true,
    hasBoardTab: true,
    engineRunning: false,
    openImport: noop,
    createNewTab: noop,
    createPlayTab: noop,
    createAnalysisTab: noop,
    createPuzzleTab: noop,
    closeCurrentTab: noop,
    closeOtherTabs: noop,
    ...overrides,
  });
}

describe("application command registry", () => {
  test("marks unsupported board actions as disabled with a reason", () => {
    const commands = buildCommands({ hasBoardTab: true });
    const saveCommand = commands.find((command) => command.id === "game.save");

    expect(saveCommand?.disabled).toBe(true);
    expect(saveCommand?.disabledReason).toBe("Open a board tab first");
  });

  test("omits disabled commands from spotlight actions", () => {
    const commands = buildCommands({ hasActiveTab: false, hasBoardTab: false });
    const actions = commandsToSpotlightActions(commands);
    const serialized = JSON.stringify(actions);

    expect(serialized).not.toContain("game.closeCurrentTab");
    expect(serialized).not.toContain("game.save");
  });

  test("derives menu groups from command menu metadata", () => {
    const commands = buildCommands({
      saveCurrentGame: noop,
      copyFen: noop,
      copyPgn: noop,
    });

    const groups = commandsToMenuGroups(commands, (shortcut) => shortcut.toUpperCase());
    const fileGroup = groups.find((group) => group.label === "features.menu.file");

    expect(fileGroup?.options.map((option) => option.id)).toContain("game.importPgn");
    expect(fileGroup?.options.map((option) => option.id)).toContain("game.save");
  });

  test("uses readable navigation labels and descriptions when translations are missing", () => {
    const commands = buildCommands();
    const analysisCommand = commands.find((command) => command.id === "nav.analysis");

    expect(analysisCommand?.label).toBe("Analysis");
    expect(analysisCommand?.description).toBe("Open Analysis");
  });
});
