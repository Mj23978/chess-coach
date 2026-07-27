import type { SpotlightActionData, SpotlightActionGroupData } from "@mantine/spotlight";
import { IconCommand, IconFile } from "@tabler/icons-react";
import { readDir } from "@tauri-apps/plugin-fs";
import type { NavigateFn } from "@tanstack/react-router";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { AppCommand } from "@/app/commands";
import {
  type Directory,
  type FileMetadata,
  processEntriesRecursively,
} from "@/features/files/utils/file";
import { getDocumentDir } from "@/utils/documentDir";
import { openFile } from "@/utils/files";
import type { Tab } from "@/utils/tabs";

export type SearchResultGroup =
  | "Commands"
  | "Games"
  | "Players"
  | "Databases"
  | "Positions"
  | "Openings"
  | "Repertoires"
  | "Studies"
  | "Files";

export type SearchResult = {
  id: string;
  group: SearchResultGroup;
  title: string;
  description?: string;
  keywords?: string[];
  icon?: ReactNode;
  action: () => void;
};

export type SearchProvider = {
  id: string;
  group: SearchResultGroup;
  search: (query: string) => Promise<SearchResult[]>;
};

type SearchContext = {
  commands: AppCommand[];
  navigate: NavigateFn;
  setTabs: Dispatch<SetStateAction<Tab[]>>;
  setActiveTab: Dispatch<SetStateAction<string | null>>;
};

const searchIcon = (icon: ReactNode) => icon;

function flattenFiles(entries: (FileMetadata | Directory)[]): FileMetadata[] {
  return entries.flatMap((entry) => {
    if (entry.type === "directory") return flattenFiles(entry.children);
    return [entry];
  });
}

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

export function buildSearchProviders(ctx: SearchContext): SearchProvider[] {
  return [
    {
      id: "commands",
      group: "Commands",
      search: async (query) => {
        const normalizedQuery = normalize(query);
        if (normalizedQuery.length < 2) return [];

        return ctx.commands
          .filter((command) => !command.disabled)
          .filter((command) => {
            const haystack = [
              command.label,
              command.description,
              command.group,
              ...(command.aliases ?? []),
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return haystack.includes(normalizedQuery);
          })
          .slice(0, 8)
          .map((command) => ({
            id: `command:${command.id}`,
            group: "Commands" as const,
            title: command.label,
            description: command.description ?? command.aliases?.join(" · "),
            keywords: command.aliases,
            icon: searchIcon(<IconCommand size={18} stroke={1.6} />),
            action: command.action,
          }));
      },
    },
    {
      id: "files",
      group: "Files",
      search: async (query) => {
        const normalizedQuery = normalize(query);
        if (normalizedQuery.length < 2) return [];

        const documentDir = await getDocumentDir();
        const entries = await readDir(documentDir);
        const files = flattenFiles(await processEntriesRecursively(documentDir, entries));

        return files
          .filter((file) => {
            const haystack = [
              file.name,
              file.path,
              file.metadata.type,
              ...file.metadata.tags,
              `${file.numGames} games`,
            ]
              .join(" ")
              .toLowerCase();

            return haystack.includes(normalizedQuery);
          })
          .slice(0, 8)
          .map((file) => ({
            id: `file:${file.path}`,
            group: file.metadata.type === "repertoire" ? ("Repertoires" as const) : ("Files" as const),
            title: file.name,
            description: `${file.metadata.type} · ${file.numGames} game${file.numGames === 1 ? "" : "s"}`,
            keywords: [file.metadata.type, ...file.metadata.tags],
            icon: searchIcon(<IconFile size={18} stroke={1.6} />),
            action: async () => {
              await openFile(file.path, ctx.setTabs, ctx.setActiveTab);
              ctx.navigate({ to: "/boards" });
            },
          }));
      },
    },
  ];
}

export async function searchAll(query: string, providers: SearchProvider[]): Promise<SearchResult[]> {
  const settledResults = await Promise.allSettled(
    providers.map((provider) => provider.search(query)),
  );

  return settledResults.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

export function searchResultsToSpotlightActions(
  results: SearchResult[],
): (SpotlightActionGroupData | SpotlightActionData)[] {
  const groups = new Map<SearchResultGroup, SpotlightActionData[]>();

  for (const result of results) {
    const action: SpotlightActionData = {
      id: result.id,
      label: result.title,
      description: result.description,
      keywords: result.keywords,
      leftSection: result.icon,
      onClick: result.action,
    };

    groups.set(result.group, [...(groups.get(result.group) ?? []), action]);
  }

  return Array.from(groups.entries()).map(([group, actions]) => ({ group, actions }));
}
