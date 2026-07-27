import { ActionIcon, Badge, Group, Menu, Text, Tooltip } from "@mantine/core";
import {
  IconCamera,
  IconClipboard,
  IconCopy,
  IconDatabaseSearch,
  IconDeviceFloppy,
  IconDots,
  IconEdit,
  IconEraser,
  IconFileImport,
  IconPlayerPause,
  IconPlayerPlay,
  IconRotateClockwise,
  IconSwitchVertical,
} from "@tabler/icons-react";

export type WorkbenchToolbarAction = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tooltip?: string;
  primary?: boolean;
};

interface WorkbenchToolbarProps {
  title: string;
  dirty?: boolean;
  engineRunning?: boolean;
  actions: WorkbenchToolbarAction[];
}

export const toolbarIcons = {
  import: <IconFileImport size="1rem" />,
  save: <IconDeviceFloppy size="1rem" />,
  startEngine: <IconPlayerPlay size="1rem" />,
  stopEngine: <IconPlayerPause size="1rem" />,
  flip: <IconSwitchVertical size="1rem" />,
  copy: <IconCopy size="1rem" />,
  fen: <IconClipboard size="1rem" />,
  setup: <IconEdit size="1rem" />,
  snapshot: <IconCamera size="1rem" />,
  search: <IconDatabaseSearch size="1rem" />,
  clear: <IconEraser size="1rem" />,
  reset: <IconRotateClockwise size="1rem" />,
};

export default function WorkbenchToolbar({
  title,
  dirty = false,
  engineRunning = false,
  actions,
}: WorkbenchToolbarProps) {
  const primaryActions = actions.filter((action) => action.primary).slice(0, 8);
  const overflowActions = actions.filter(
    (action) => !action.primary || !primaryActions.includes(action),
  );

  return (
    <Group
      justify="space-between"
      wrap="nowrap"
      px="xs"
      py={6}
      style={{
        borderBottom:
          "1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))",
        minHeight: 38,
      }}
    >
      <Group gap="xs" wrap="nowrap" miw={0}>
        <Text size="sm" fw={700} truncate>
          {title}
        </Text>
        {dirty && (
          <Badge size="xs" variant="light" color="yellow">
            Unsaved
          </Badge>
        )}
        <Badge size="xs" variant="light" color={engineRunning ? "green" : "gray"}>
          {engineRunning ? "Engine running" : "Engine stopped"}
        </Badge>
      </Group>

      <Group gap={4} wrap="nowrap">
        {primaryActions.map((action) => (
          <Tooltip key={action.id} label={action.tooltip ?? action.label}>
            <ActionIcon
              variant={action.id === "engine" && engineRunning ? "filled" : "default"}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              aria-label={action.label}
            >
              {action.icon}
            </ActionIcon>
          </Tooltip>
        ))}
        {overflowActions.length > 0 && (
          <Menu position="bottom-end" shadow="md">
            <Menu.Target>
              <ActionIcon variant="default" size="sm" aria-label="More board actions">
                <IconDots size="1rem" />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {overflowActions.map((action) => (
                <Menu.Item
                  key={action.id}
                  leftSection={action.icon}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </Group>
  );
}
