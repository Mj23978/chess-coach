import { Button, Checkbox, Group, SegmentedControl, Stack, TextInput } from "@mantine/core";
import type { ContextModalProps } from "@mantine/modals";
import { useLoaderData } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { match } from "ts-pattern";
import { FilenameInput } from "@/features/files/components/FilenameInput";
import { FileTypeSelector } from "@/features/files/components/FileTypeSelector";
import { PgnSourceInput, type PgnTarget } from "@/features/files/components/PgnSourceInput";
import type { FileType } from "@/features/files/utils/file";
import { activeTabAtom, currentTabAtom, tabsAtom } from "@/state/atoms";
import {
  importGameContent,
  type ImportResult,
  type ImportSource,
} from "../import/importService";
import { ImportSummary } from "./ImportSummary";

export default function ImportModal({
  context,
  id,
  innerProps,
}: ContextModalProps<{ initialSource?: ImportSource }>) {
  const { t } = useTranslation();
  const [pgnTarget, setPgnTarget] = useState<PgnTarget>({ type: "pgn", target: "" });
  const [fen, setFen] = useState("");
  const [link, setLink] = useState("");
  const [importType, setImportType] = useState<ImportSource>(innerProps.initialSource ?? "PGN");
  const [filetype, setFiletype] = useState<FileType>("game");
  const [loading, setLoading] = useState(false);
  const [, setCurrentTab] = useAtom(currentTabAtom);
  const [, setTabs] = useAtom(tabsAtom);
  const [, setActiveTab] = useAtom(activeTabAtom);
  const [fenError, setFenError] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [save, setSave] = useState(false);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const { documentDir } = useLoaderData({ from: "/boards" });

  async function handleSubmit() {
    setLoading(true);
    setImportResult(null);
    setError("");
    setFenError("");

    try {
      const result = await importGameContent(
        match(importType)
          .with("PGN", () => ({
            source: "PGN" as const,
            pgnTarget,
            save,
            filename,
            filetype,
            documentDir,
          }))
          .with("Link", () => ({
            source: "Link" as const,
            link,
            analysisTitle: t("features.tabs.analysisBoard.title"),
          }))
          .with("FEN", () => ({
            source: "FEN" as const,
            fen,
            analysisTitle: t("features.tabs.analysisBoard.title"),
          }))
          .exhaustive(),
        { setTabs, setActiveTab, setCurrentTab },
      );

      if (importType === "FEN" && result.errors[0]) {
        setFenError(result.errors[0].error);
      } else if (result.errors[0] && result.successCount === 0) {
        setError(result.errors[0].error);
      }

      if (importType === "PGN") {
        setImportResult(result);
      } else if (result.closeOnSuccess && result.successCount > 0) {
        context.closeModal(id);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  const Input = match(importType)
    .with("PGN", () => (
      <Stack>
        <PgnSourceInput
          setFilename={setFilename}
          setPgnTarget={setPgnTarget}
          pgnTarget={pgnTarget}
          allowMultiple={true}
        />

        <Checkbox
          label={t("features.tabs.importGame.saveToCollection")}
          checked={save}
          onChange={(e) => setSave(e.currentTarget.checked)}
        />

        {save && (
          <>
            <FilenameInput value={filename} onChange={setFilename} error={error} />
            <FileTypeSelector value={filetype} onChange={setFiletype} />
          </>
        )}
      </Stack>
    ))
    .with("Link", () => (
      <TextInput
        value={link}
        onChange={(event) => setLink(event.currentTarget.value)}
        label={t("features.tabs.importGame.url")}
        data-autofocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
      />
    ))
    .with("FEN", () => (
      <TextInput
        value={fen}
        onChange={(event) => setFen(event.currentTarget.value)}
        error={fenError}
        label="FEN"
        data-autofocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
      />
    ))
    .exhaustive();

  const disabled = match(importType)
    .with(
      "PGN",
      () =>
        !pgnTarget.target ||
        (Array.isArray(pgnTarget.target) ? pgnTarget.target.length === 0 : !pgnTarget.target) ||
        (save && !filename.trim()),
    )
    .with("Link", () => !link)
    .with("FEN", () => !fen)
    .exhaustive();

  if (importResult) {
    return (
      <Stack>
        <ImportSummary result={importResult} />
        <Group>
          <Button variant="default" onClick={() => setImportResult(null)}>
            {t("common.importMore")}
          </Button>
          <Button onClick={() => context.closeModal(id)}>{t("common.close")}</Button>
        </Group>
      </Stack>
    );
  }

  return (
    <>
      <SegmentedControl
        fullWidth
        mb="sm"
        value={importType}
        onChange={(value) => setImportType(value as ImportSource)}
        data={[
          { value: "PGN", label: "PGN" },
          { value: "Link", label: t("features.tabs.importGame.online") },
          { value: "FEN", label: "FEN" },
        ]}
      />

      {Input}

      <Button
        fullWidth
        mt="md"
        radius="md"
        loading={loading}
        disabled={disabled}
        onClick={handleSubmit}
      >
        {loading ? t("features.tabs.importGame.importing") : t("features.tabs.importGame.import")}
      </Button>
    </>
  );
}
