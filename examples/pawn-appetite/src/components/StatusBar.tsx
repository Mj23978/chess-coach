import { Group, Text, UnstyledButton } from "@mantine/core";
import { IconChartLine, IconCpu, IconLayoutSidebar, IconStack2 } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { activeTabAtom, enginesAtom, tabsAtom } from "@/state/atoms";

export default function StatusBar() {
  const navigate = useNavigate();
  const tabs = useAtomValue(tabsAtom);
  const activeTab = useAtomValue(activeTabAtom);
  const engines = useAtomValue(enginesAtom);
  const active = tabs.find((tab) => tab.value === activeTab);
  const loadedEngine = engines.find((engine) => engine.loaded);

  return (
    <Group
      h="100%"
      px="xs"
      gap="md"
      wrap="nowrap"
      style={{
        borderTop: "1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))",
        background: "light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))",
      }}
    >
      <Group gap={4} wrap="nowrap">
        <IconLayoutSidebar size="0.85rem" />
        <Text size="xs" c="dimmed">
          {active?.type === "puzzles"
            ? "Training"
            : active?.type === "play"
              ? "Play"
              : active?.type === "analysis"
                ? "Analysis"
                : "Workbench"}
        </Text>
      </Group>
      <Group gap={4} wrap="nowrap">
        <IconStack2 size="0.85rem" />
        <Text size="xs" c="dimmed">
          {tabs.length} tab{tabs.length === 1 ? "" : "s"}
        </Text>
      </Group>
      <UnstyledButton onClick={() => navigate({ to: "/engines" })}>
        <Group gap={4} wrap="nowrap">
          <IconCpu size="0.85rem" />
          <Text size="xs" c="dimmed">
            {loadedEngine ? loadedEngine.name : "No engine loaded"}
          </Text>
        </Group>
      </UnstyledButton>
      {active && (
        <Group gap={4} wrap="nowrap" style={{ marginLeft: "auto" }}>
          <IconChartLine size="0.85rem" />
          <Text size="xs" c="dimmed" truncate maw="18rem">
            {active.name}
          </Text>
        </Group>
      )}
    </Group>
  );
}
