import {
  Title,
  Text,
  Stack,
  Group,
  Button,
  Paper,
  Badge,
  Anchor,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconPlus,
  IconEdit,
  IconBell,
} from "@tabler/icons-react";
import { Link } from "react-router";
import { ConfigCard, type ConfigCardProps } from "~/components/configs";
import { EmptyState } from "~/components/ui";

export interface ChannelDetailPageProps {
  channel: {
    id: string;
    name: string;
    webhookUrl: string;
  };
  configs: ConfigCardProps[];
  onAddConfig: () => void;
  onEditConfig: (searchTerm: string) => void;
  onDeleteConfig: (searchTerm: string) => void;
  onToggleConfig: (searchTerm: string, enabled: boolean) => void;
  onTestNotification: () => void;
  isTestingNotification?: boolean;
}

export function ChannelDetailPage({
  channel,
  configs,
  onAddConfig,
  onEditConfig,
  onDeleteConfig,
  onToggleConfig,
  onTestNotification,
  isTestingNotification,
}: ChannelDetailPageProps) {
  const maskedWebhook = channel.webhookUrl.replace(
    /discord\.com\/api\/webhooks\/\d+\/[^/]+/,
    "discord.com/api/webhooks/****/****"
  );

  return (
    <Stack gap="lg" data-testid="channel-detail-page">
      <Anchor component={Link} to="/dashboard/channels" c="dimmed" size="sm">
        <Group gap="xs">
          <IconArrowLeft size={16} />
          Back to Channels
        </Group>
      </Anchor>

      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2} data-testid="channel-name">
            {channel.name}
          </Title>
          <Text c="dimmed" size="sm" data-testid="webhook-url">
            {maskedWebhook}
          </Text>
        </div>
        <Group>
          <Button
            variant="light"
            leftSection={<IconBell size={18} />}
            onClick={onTestNotification}
            loading={isTestingNotification}
            data-testid="test-notification-button"
          >
            Test
          </Button>
          <Button
            component={Link}
            to={`/dashboard/channels/${channel.id}/edit`}
            variant="light"
            leftSection={<IconEdit size={18} />}
            data-testid="edit-channel-button"
          >
            Edit
          </Button>
        </Group>
      </Group>

      <Paper withBorder p="lg">
        <Group justify="space-between" mb="md">
          <Group gap="sm">
            <Title order={4}>Search Terms</Title>
            <Badge variant="light">{configs.length}</Badge>
          </Group>
          <Button
            size="sm"
            leftSection={<IconPlus size={16} />}
            onClick={onAddConfig}
            data-testid="add-config-button"
          >
            Add Search Term
          </Button>
        </Group>

        {configs.length === 0 ? (
          <EmptyState
            title="No search terms"
            description="Add search terms to start receiving notifications for matching deals."
            actionLabel="Add Search Term"
            onAction={onAddConfig}
          />
        ) : (
          <Stack gap="sm" data-testid="configs-list">
            {configs.map((config) => (
              <ConfigCard
                key={config.searchTerm}
                {...config}
                onEdit={() => onEditConfig(config.searchTerm)}
                onDelete={() => onDeleteConfig(config.searchTerm)}
                onToggle={(enabled) => onToggleConfig(config.searchTerm, enabled)}
              />
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
