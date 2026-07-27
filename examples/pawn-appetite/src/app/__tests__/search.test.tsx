import { describe, expect, test } from "vitest";
import { searchAll, searchResultsToSpotlightActions, type SearchProvider } from "@/app/search";

describe("global search adapters", () => {
  test("returns fulfilled provider results and ignores failed providers", async () => {
    const providers: SearchProvider[] = [
      {
        id: "ok",
        group: "Files",
        search: async () => [
          {
            id: "file:test",
            group: "Files",
            title: "Test PGN",
            description: "game · 1 game",
            action: () => undefined,
          },
        ],
      },
      {
        id: "failed",
        group: "Databases",
        search: async () => {
          throw new Error("backend unavailable");
        },
      },
    ];

    const results = await searchAll("test", providers);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("file:test");
  });

  test("groups search results for spotlight rendering", () => {
    const actions = searchResultsToSpotlightActions([
      {
        id: "file:test",
        group: "Files",
        title: "Test PGN",
        action: () => undefined,
      },
    ]);

    expect(actions).toEqual([
      {
        group: "Files",
        actions: [
          expect.objectContaining({
            id: "file:test",
            label: "Test PGN",
          }),
        ],
      },
    ]);
  });
});
