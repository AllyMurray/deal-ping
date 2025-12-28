import { useMemo } from "react";
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
  IconFilter,
} from "@tabler/icons-react";
import { Link } from "react-router";
import { ConfigCard, type ConfigCardProps } from "~/components/configs";
import { DealCard, FilterConfigPanel, type DealCardProps } from "~/components/deals";
import { EmptyState } from "~/components/ui";
import { applyFilter, type FilterConfig } from "~/lib/deal-filter";

// Re-export FilterConfig as FilterConfigState for backwards compatibility
export type FilterConfigState = FilterConfig;

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
  // Filter preview
  filterConfig: FilterConfigState;
  onFilterConfigChange: (config: Partial<FilterConfigState>) => void;
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
  filterConfig,
  onFilterConfigChange,
}: ChannelDetailPageProps) {
  const maskedWebhook = channel.webhookUrl.replace(
    /discord\.com\/api\/webhooks\/\d+\/[^/]+/,
    "discord.com/api/webhooks/****/****"
  );

  // Apply live filtering based on current filter config
  const dealsWithLiveFilter = useMemo(() => {
    return deals.map((deal) => {
      const result = applyFilter(
        { id: deal.id, title: deal.title, merchant: deal.merchant, searchTerm: deal.searchTerm },
        filterConfig
      );
      return {
        ...deal,
        liveFilterStatus: result.filterStatus,
        liveFilterReason: result.filterReason,
        liveMatchDetails: JSON.stringify(result.matchDetails),
      };
    });
  }, [deals, filterConfig]);

  // Count filtered deals based on live filter status
  const filteredCount = dealsWithLiveFilter.filter(
    (d) => d.liveFilterStatus && d.liveFilterStatus !== 'passed'
  ).length;
  const passedCount = dealsWithLiveFilter.length - filteredCount;

  // Filter displayed deals based on toggle
  const displayedDeals = showFiltered
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

      {/* Filter Preview Section */}
      <Paper withBorder p="lg">
        <Group justify="space-between" mb="md">
          <Group gap="sm">
            <IconFilter size={20} />
            <Title order={4}>Filter Results</Title>
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

        {/* Filter Configuration Panel */}
        <FilterConfigPanel
          searchTerm={filterConfig.searchTerm}
          includeKeywords={filterConfig.includeKeywords}
          excludeKeywords={filterConfig.excludeKeywords}
          caseSensitive={filterConfig.caseSensitive}
          onIncludeKeywordsChange={(keywords) => onFilterConfigChange({ includeKeywords: keywords })}
          onExcludeKeywordsChange={(keywords) => onFilterConfigChange({ excludeKeywords: keywords })}
          onCaseSensitiveChange={(value) => onFilterConfigChange({ caseSensitive: value })}
          passedCount={passedCount}
          filteredCount={filteredCount}
        />

        {deals.length === 0 ? (
          <EmptyState
            title="No deals yet"
            description="Deals will appear here once the notifier processes them for your search terms."
          />
        ) : displayedDeals.length === 0 ? (
          <EmptyState
            title="All deals filtered"
            description="All deals were filtered out by your current filter settings. Toggle 'Show filtered' to see them."
          />
        ) : (
          <Stack gap="sm" data-testid="deals-list" mt="md">
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
