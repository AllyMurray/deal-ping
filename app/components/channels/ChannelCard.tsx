import {
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
  Stack,
  Box,
} from "@mantine/core";
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconBrandDiscord,
  IconSearch,
  IconChevronRight,
} from "@tabler/icons-react";
import { Link } from "react-router";

export interface ChannelCardProps {
  id: string;
  name: string;
  webhookUrl: string;
  configCount: number;
  enabledConfigCount: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ChannelCard({
  id,
  name,
  webhookUrl,
  configCount,
  enabledConfigCount,
  onEdit,
  onDelete,
}: ChannelCardProps) {
  const maskedWebhook = webhookUrl.replace(
    /discord\.com\/api\/webhooks\/\d+\/[^/]+/,
    "discord.com/api/webhooks/****/****"
  );

  return (
    <Box
      component={Link}
      to={`/dashboard/channels/${id}`}
      className="channel-card"
      p="lg"
      data-testid={`channel-card-${id}`}
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
        cursor: "pointer",
      }}
    >
      {/* Header */}
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <Box
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, #5865F2, #4752C4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(88, 101, 242, 0.25)",
            }}
          >
            <IconBrandDiscord size={20} color="white" stroke={1.5} />
          </Box>
          <Box>
            <Text fw={600} size="md" data-testid="channel-name">
              {name}
            </Text>
            <Text
              size="xs"
              c="dimmed"
              ff="monospace"
              lineClamp={1}
              data-testid="webhook-url"
            >
              {maskedWebhook}
            </Text>
          </Box>
        </Group>

        <Menu position="bottom-end" withArrow shadow="md" radius="md">
          <Menu.Target>
            <ActionIcon
              variant="subtle"
              size="lg"
              radius="md"
              onClick={(e) => e.preventDefault()}
              data-testid="channel-menu"
            >
              <IconDotsVertical size={18} stroke={1.5} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconEdit size={16} stroke={1.5} />}
              onClick={(e) => {
                e.preventDefault();
                onEdit?.();
              }}
              data-testid="edit-channel"
            >
              Edit Channel
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconTrash size={16} stroke={1.5} />}
              color="red"
              onClick={(e) => {
                e.preventDefault();
                onDelete?.();
              }}
              data-testid="delete-channel"
            >
              Delete Channel
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      {/* Stats Row */}
      <Group gap="md" mb="md">
        <Group gap="xs">
          <IconSearch size={14} stroke={1.5} style={{ color: "var(--text-muted)" }} />
          <Text size="sm" c="dimmed">
            <Text component="span" fw={600} c="inherit">
              {configCount}
            </Text>{" "}
            search term{configCount !== 1 ? "s" : ""}
          </Text>
        </Group>

        {enabledConfigCount < configCount && (
          <Badge
            size="sm"
            variant="light"
            color="yellow"
            data-testid="enabled-count"
          >
            {enabledConfigCount} active
          </Badge>
        )}
      </Group>

      {/* View Details Link */}
      <Group justify="flex-end">
        <Text size="xs" c="dimmed" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          View details
          <IconChevronRight size={14} stroke={2} />
        </Text>
      </Group>
    </Box>
  );
}
