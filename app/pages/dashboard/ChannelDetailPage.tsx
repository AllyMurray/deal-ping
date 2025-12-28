import {
  Title,
  Text,
  Stack,
  Group,
  Button,
  Paper,
  Badge,
  Anchor,
  Switch,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconPlus,
  IconEdit,
  IconBell,
  IconHistory,
} from "@tabler/icons-react";
import { Link } from "react-router";
import { ConfigCard, type ConfigCardProps } from "~/components/configs";
import { DealCard, type DealCardProps } from "~/components/deals";
import { EmptyState } from "~/components/ui";

export interface ChannelDetailPageProps {
  channel: {
    id: string;
    name: string;
    webhookUrl: string;
  };
  configs: ConfigCardProps[];
  deals?: DealCardProps[];
  onAddConfig: () => void;
  onEditConfig: (searchTerm: string) => void;
  onDeleteConfig: (searchTerm: string) => void;
  onToggleConfig: (searchTerm: string, enabled: boolean) => void;
  onTestNotification: () => void;
  isTestingNotification?: boolean;
  showFiltered?: boolean;
  onShowFilteredChange?: (value: boolean) => void;
}

export function ChannelDetailPage({
  channel,
  configs,
  deals = [],
  onAddConfig,
  onEditConfig,
  onDeleteConfig,
  onToggleConfig,
  onTestNotification,
  isTestingNotification,
  showFiltered = false,
  onShowFilteredChange,
}: ChannelDetailPageProps) {
  const maskedWebhook = channel.webhookUrl.replace(
    /discord\.com\/api\/webhooks\/\d+\/[^/]+/,
    "discord.com/api/webhooks/****/****"
  );

  // Count filtered deals
  const filteredCount = deals.filter(
    (d) => d.filterStatus && d.filterStatus !== 'passed'
  ).length;
  const passedCount = deals.length - filteredCount;

  // Filter displayed deals based on toggle
  const displayedDeals = showFiltered
    ? deals
    : deals.filter((d) => !d.filterStatus || d.filterStatus === 'passed');

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

      {/* Recent Deals Section */}
      <Paper withBorder p="lg">
        <Group justify="space-between" mb="md">
          <Group gap="sm">
            <IconHistory size={20} />
            <Title order={4}>Recent Deals</Title>
            <Badge variant="light">{passedCount} passed</Badge>
            {filteredCount > 0 && (
              <Badge variant="light" color="gray">
                {filteredCount} filtered
              </Badge>
            )}
          </Group>
          {onShowFilteredChange && filteredCount > 0 && (
            <Switch
              label="Show filtered"
              checked={showFiltered}
              onChange={(e) => onShowFilteredChange(e.currentTarget.checked)}
              data-testid="show-filtered-toggle"
            />
          )}
        </Group>

        {deals.length === 0 ? (
          <EmptyState
            title="No deals yet"
            description="Deals will appear here once the notifier processes them for your search terms."
          />
        ) : displayedDeals.length === 0 ? (
          <EmptyState
            title="All deals filtered"
            description="All deals were filtered out by your keywords. Toggle 'Show filtered' to see them."
          />
        ) : (
          <Stack gap="sm" data-testid="deals-list">
            {displayedDeals.map((deal) => (
              <DealCard key={deal.id} {...deal} />
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
