import { useMemo, useState } from "react";
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
  Collapse,
  UnstyledButton,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconPlus,
  IconEdit,
  IconBell,
  IconFilter,
  IconEye,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import { Link } from "react-router";
import { ConfigCard, type ConfigCardProps } from "~/components/configs";
import { DealCard, type DealCardProps } from "~/components/deals";
import { DiscordPreview } from "~/components/notifications";
import { EmptyState } from "~/components/ui";
import { applyFilter } from "~/lib/deal-filter";

export interface ChannelDetailPageProps {
  channel: {
    id: string;
    name: string;
    webhookUrl: string;
  };
  configs: (ConfigCardProps & { caseSensitive?: boolean; maxPrice?: number | null; minDiscount?: number | null })[];
  deals?: DealCardProps[];
  onAddConfig: () => void;
  onEditConfig: (searchTerm: string) => void;
  onDeleteConfig: (searchTerm: string) => void;
  onToggleConfig: (searchTerm: string, enabled: boolean) => void;
  onTestNotification: () => void;
  isTestingNotification?: boolean;
  showExcluded?: boolean;
  onShowExcludedChange?: (value: boolean) => void;
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
  showExcluded = true,
  onShowExcludedChange,
}: ChannelDetailPageProps) {
  const [showPreview, setShowPreview] = useState(false);

  const maskedWebhook = channel.webhookUrl.replace(
    /discord\.com\/api\/webhooks\/\d+\/[^/]+/,
    "discord.com/api/webhooks/****/****"
  );

  // Build a map of search term -> config for quick lookup
  const configMap = useMemo(() => {
    const map = new Map<string, typeof configs[0]>();
    for (const config of configs) {
      map.set(config.searchTerm, config);
    }
    return map;
  }, [configs]);

  // Apply filtering based on each deal's associated search term config
  const dealsWithLiveFilter = useMemo(() => {
    return deals.map((deal) => {
      const config = configMap.get(deal.searchTerm);
      if (!config) {
        // No config found for this search term - show as passed
        return {
          ...deal,
          liveFilterStatus: 'passed' as const,
          liveFilterReason: undefined,
          liveMatchDetails: undefined,
        };
      }

      const result = applyFilter(
        { id: deal.id, title: deal.title, merchant: deal.merchant, searchTerm: deal.searchTerm },
        {
          searchTerm: config.searchTerm,
          includeKeywords: config.includeKeywords,
          excludeKeywords: config.excludeKeywords,
          caseSensitive: config.caseSensitive ?? false,
        }
      );
      return {
        ...deal,
        liveFilterStatus: result.filterStatus,
        liveFilterReason: result.filterReason,
        liveMatchDetails: JSON.stringify(result.matchDetails),
      };
    });
  }, [deals, configMap]);

  // Count excluded deals based on live filter status
  const excludedCount = dealsWithLiveFilter.filter(
    (d) => d.liveFilterStatus && d.liveFilterStatus !== 'passed'
  ).length;
  const passedCount = dealsWithLiveFilter.length - excludedCount;

  // Filter displayed deals based on toggle
  const displayedDeals = showExcluded
    ? dealsWithLiveFilter
    : dealsWithLiveFilter.filter((d) => !d.liveFilterStatus || d.liveFilterStatus === 'passed');

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
          <Title order={2} data-testid="channel-name" mb={4}>
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

      {/* Notification Preview Section */}
      {configs.length > 0 && (
        <Paper withBorder p="lg" data-testid="notification-preview-section">
          <UnstyledButton
            onClick={() => setShowPreview(!showPreview)}
            style={{ width: "100%" }}
            data-testid="preview-toggle"
          >
            <Group justify="space-between">
              <Group gap="sm">
                <IconEye size={20} />
                <Title order={4}>Notification Preview</Title>
                <Badge variant="light" size="sm">
                  See how notifications look
                </Badge>
              </Group>
              {showPreview ? (
                <IconChevronUp size={20} style={{ color: "var(--mantine-color-dimmed)" }} />
              ) : (
                <IconChevronDown size={20} style={{ color: "var(--mantine-color-dimmed)" }} />
              )}
            </Group>
          </UnstyledButton>

          <Collapse in={showPreview}>
            <Stack gap="md" mt="md">
              <Text size="sm" c="dimmed">
                This is a preview of how Discord notifications will appear for your first search term.
                The actual notification will include real deal data when matches are found.
              </Text>
              <DiscordPreview
                searchTerm={configs[0].searchTerm}
                maxPrice={configs[0].maxPrice}
                minDiscount={configs[0].minDiscount}
              />
            </Stack>
          </Collapse>
        </Paper>
      )}

      {/* Deals Section */}
      <Paper withBorder p="lg">
        <Group justify="space-between" mb="md">
          <Group gap="sm">
            <IconFilter size={20} />
            <Title order={4}>Deals</Title>
            <Badge variant="light" color="green" size="sm">
              {passedCount} included
            </Badge>
            {excludedCount > 0 && (
              <Badge variant="light" color="gray" size="sm">
                {excludedCount} excluded
              </Badge>
            )}
          </Group>
          {onShowExcludedChange && excludedCount > 0 && (
            <Switch
              label="Show excluded"
              checked={showExcluded}
              onChange={(e) => onShowExcludedChange(e.currentTarget.checked)}
              data-testid="show-excluded-toggle"
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
            title="No deals to show"
            description="All deals are excluded by your search term filters. Toggle 'Show excluded' to see them."
          />
        ) : (
          <Stack gap="sm" data-testid="deals-list">
            {displayedDeals.map((deal) => (
              <DealCard
                key={deal.id}
                {...deal}
                filterStatus={deal.liveFilterStatus}
                filterReason={deal.liveFilterReason}
                matchDetails={deal.liveMatchDetails}
              />
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
