import { basename } from "@tauri-apps/api/path";
import { makeFen, parseFen } from "chessops/fen";
import type { Dispatch, SetStateAction } from "react";
import type { PgnTarget, ResolvedPgnTarget } from "@/features/files/components/PgnSourceInput";
import { resolvePgnTarget } from "@/features/files/components/PgnSourceInput";
import type { FileType } from "@/features/files/utils/file";
import { parsePGN } from "@/utils/chess";
import { getChesscomGame } from "@/utils/chess.com/api";
import { chessopsError } from "@/utils/chessops";
import { createFile, createTempImportFile, openFile } from "@/utils/files";
import { getLichessGame } from "@/utils/lichess/api";
import { parseMultiplePgnGames } from "@/utils/pgnUtils";
import { serializeStorageValue } from "@/utils/tabStateStorage";
import type { Tab } from "@/utils/tabs";
import { defaultTree, getGameName, type TreeState } from "@/utils/treeReducer";

export type ImportSource = "PGN" | "Link" | "FEN";

export interface ImportResult {
  successCount: number;
  totalGames: number;
  errors: { file?: string; error: string }[];
  failedGames?: { gameIndex: number; error: string; fileName?: string }[];
  importedFiles?: { path: string; name: string; gameCount: number }[];
  closeOnSuccess?: boolean;
}

export type ImportRequest =
  | {
      source: "PGN";
      pgnTarget: PgnTarget;
      save: boolean;
      filename: string;
      filetype: FileType;
      documentDir: string;
    }
  | {
      source: "Link";
      link: string;
      analysisTitle: string;
    }
  | {
      source: "FEN";
      fen: string;
      analysisTitle: string;
    };

export interface ImportContext {
  setTabs: Dispatch<SetStateAction<Tab[]>>;
  setActiveTab: Dispatch<SetStateAction<string | null>>;
  setCurrentTab: (value: Tab | ((currentTab: Tab) => Tab)) => void;
}

async function parseGamesFromTarget(resolvedTarget: ResolvedPgnTarget): Promise<{
  trees: TreeState[];
  errors: { gameIndex: number; error: string; fileName?: string }[];
}> {
  const trees: TreeState[] = [];
  const errors: { gameIndex: number; error: string; fileName?: string }[] = [];

  if (resolvedTarget.type === "pgn") {
    const { games, errors: parseErrors } = await parseMultiplePgnGames(resolvedTarget.content);

    trees.push(...games.map((game) => game.tree));
    errors.push(
      ...parseErrors.map((error) => ({
        gameIndex: error.gameIndex,
        error: error.error,
        fileName: "Pasted Content",
      })),
    );
  } else {
    for (let i = 0; i < resolvedTarget.games.length; i++) {
      try {
        const gameContent = resolvedTarget.games[i].trim();
        if (gameContent) {
          const tree = await parsePGN(gameContent);
          trees.push(tree);
        }
      } catch (error) {
        errors.push({
          gameIndex: i,
          error: error instanceof Error ? error.message : String(error),
          fileName: resolvedTarget.file.name || "Unknown File",
        });
      }
    }
  }

  return { trees, errors };
}

async function importResolvedPgnTarget(
  resolvedTarget: ResolvedPgnTarget,
  request: Extract<ImportRequest, { source: "PGN" }>,
  context: ImportContext,
): Promise<ImportResult> {
  if (resolvedTarget.type === "pgn") {
    const { trees, errors } = await parseGamesFromTarget(resolvedTarget);
    const importedFiles: { path: string; name: string; gameCount: number }[] = [];

    if (trees.length > 0) {
      if (request.save) {
        const newFile = await createFile({
          filename: request.filename,
          filetype: request.filetype,
          pgn: resolvedTarget.content,
          dir: request.documentDir,
        });

        if (newFile.isErr) {
          return {
            successCount: 0,
            totalGames: resolvedTarget.count,
            errors: [{ error: newFile.error.message }],
            failedGames: errors,
            importedFiles: [],
          };
        }

        importedFiles.push({
          path: newFile.value.path,
          name: request.filename,
          gameCount: trees.length,
        });
        await openFile(newFile.value.path, context.setTabs, context.setActiveTab);
      } else {
        const tempFile = await createTempImportFile(resolvedTarget.content);
        importedFiles.push({
          path: tempFile.path,
          name: "Pasted Content",
          gameCount: trees.length,
        });
        await openFile(tempFile.path, context.setTabs, context.setActiveTab);
      }
    }

    return {
      successCount: trees.length,
      totalGames: resolvedTarget.count,
      errors: resolvedTarget.errors || [],
      failedGames: errors,
      importedFiles,
    };
  }

  if (resolvedTarget.type === "files" && Array.isArray(resolvedTarget.target)) {
    const importedFiles: { path: string; name: string; gameCount: number }[] = [];
    const allErrors: { file?: string; error: string }[] = [...(resolvedTarget.errors || [])];
    const failedGames: { gameIndex: number; error: string; fileName?: string }[] = [];
    let totalSuccessfulGames = 0;
    let totalGames = 0;

    for (const filePath of resolvedTarget.target) {
      try {
        const fileName = await basename(filePath);
        const singleFileTarget = await resolvePgnTarget({ type: "file", target: filePath });
        const { trees, errors } = await parseGamesFromTarget(singleFileTarget);

        totalGames += singleFileTarget.count;
        totalSuccessfulGames += trees.length;

        errors.forEach((error) => {
          failedGames.push({ ...error, fileName });
        });

        if (trees.length > 0) {
          if (request.save) {
            const baseFileName = fileName.replace(/\.pgn$/i, "");
            const finalFileName = `${request.filename}_${baseFileName}`;
            const newFile = await createFile({
              filename: finalFileName,
              filetype: request.filetype,
              pgn: singleFileTarget.content,
              dir: request.documentDir,
            });

            if (newFile.isOk) {
              importedFiles.push({
                path: newFile.value.path,
                name: finalFileName,
                gameCount: trees.length,
              });
              await openFile(newFile.value.path, context.setTabs, context.setActiveTab);
            } else {
              allErrors.push({
                file: fileName,
                error: `Failed to save: ${newFile.error.message}`,
              });
            }
          } else {
            importedFiles.push({
              path: singleFileTarget.file.path,
              name: fileName,
              gameCount: trees.length,
            });
            await openFile(singleFileTarget.file.path, context.setTabs, context.setActiveTab);
          }
        }

        if (singleFileTarget.errors) {
          allErrors.push(...singleFileTarget.errors);
        }
      } catch (error) {
        const fileName = await basename(filePath);
        allErrors.push({
          file: fileName,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      successCount: totalSuccessfulGames,
      totalGames,
      errors: allErrors,
      failedGames,
      importedFiles,
    };
  }

  const { trees, errors } = await parseGamesFromTarget(resolvedTarget);
  const importedFiles: { path: string; name: string; gameCount: number }[] = [];

  if (trees.length > 0) {
    if (request.save) {
      const newFile = await createFile({
        filename: request.filename,
        filetype: request.filetype,
        pgn: resolvedTarget.content,
        dir: request.documentDir,
      });

      if (newFile.isErr) {
        return {
          successCount: 0,
          totalGames: resolvedTarget.count,
          errors: [{ error: newFile.error.message }],
          failedGames: errors,
          importedFiles: [],
        };
      }

      importedFiles.push({
        path: newFile.value.path,
        name: request.filename,
        gameCount: trees.length,
      });
      await openFile(newFile.value.path, context.setTabs, context.setActiveTab);
    } else {
      importedFiles.push({
        path: resolvedTarget.file.path,
        name: resolvedTarget.file.name || "Imported Game",
        gameCount: trees.length,
      });
      await openFile(resolvedTarget.file.path, context.setTabs, context.setActiveTab);
    }
  }

  return {
    successCount: trees.length,
    totalGames: resolvedTarget.count,
    errors: resolvedTarget.errors || [],
    failedGames: errors,
    importedFiles,
  };
}

async function importLinkGame(
  request: Extract<ImportRequest, { source: "Link" }>,
  context: ImportContext,
): Promise<ImportResult> {
  let pgn = "";

  if (request.link.includes("chess.com")) {
    const chesscomGame = await getChesscomGame(request.link);
    if (chesscomGame === null) {
      return {
        successCount: 0,
        totalGames: 1,
        errors: [{ error: "Unable to import this Chess.com game" }],
        closeOnSuccess: false,
      };
    }
    pgn = chesscomGame;
  } else if (request.link.includes("lichess")) {
    const gameId = request.link.split("/")[3];
    pgn = await getLichessGame(gameId);
  } else {
    return {
      successCount: 0,
      totalGames: 1,
      errors: [{ error: "Unsupported game URL" }],
      closeOnSuccess: false,
    };
  }

  const tree = await parsePGN(pgn);
  context.setCurrentTab((prev) => {
    sessionStorage.setItem(prev.value, serializeStorageValue({ version: 0, state: tree }));
    return {
      ...prev,
      name: getGameName(tree.headers),
      type: "analysis",
    };
  });

  return {
    successCount: 1,
    totalGames: 1,
    errors: [],
    closeOnSuccess: true,
  };
}

function importFenPosition(
  request: Extract<ImportRequest, { source: "FEN" }>,
  context: ImportContext,
): ImportResult {
  const result = parseFen(request.fen.trim());
  if (result.isErr) {
    return {
      successCount: 0,
      totalGames: 1,
      errors: [{ error: chessopsError(result.error) }],
      closeOnSuccess: false,
    };
  }

  const parsedFen = makeFen(result.value);
  context.setCurrentTab((prev) => {
    const tree = defaultTree(parsedFen);
    tree.headers.fen = parsedFen;
    sessionStorage.setItem(prev.value, serializeStorageValue({ version: 0, state: tree }));
    return {
      ...prev,
      name: request.analysisTitle,
      type: "analysis",
    };
  });

  return {
    successCount: 1,
    totalGames: 1,
    errors: [],
    closeOnSuccess: true,
  };
}

export async function importGameContent(
  request: ImportRequest,
  context: ImportContext,
): Promise<ImportResult> {
  if (request.source === "PGN") {
    const resolvedPgnTarget = await resolvePgnTarget(request.pgnTarget);
    return importResolvedPgnTarget(resolvedPgnTarget, request, context);
  }

  if (request.source === "Link") {
    return importLinkGame(request, context);
  }

  return importFenPosition(request, context);
}
