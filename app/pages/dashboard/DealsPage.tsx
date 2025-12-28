import { Title, Text, Stack, Button, Group, Center, Switch, Badge } from "@mantine/core";
import { DealCard, DealFilters, DealStats, type DealCardProps } from "~/components/deals";
import { EmptyState } from "~/components/ui";

export interface DealsPageProps {
  deals: DealCardProps[];
  stats: {
    totalDeals: number;
    dealsToday: number;
    topSearchTerm?: string;
  };
  searchTerms: string[];
  selectedSearchTerm: string | null;
  onSearchTermChange: (value: string | null) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore?: boolean;
  showFiltered?: boolean;
  onShowFilteredChange?: (value: boolean) => void;
}

export function DealsPage({
  deals,
  stats,
  searchTerms,
  selectedSearchTerm,
  onSearchTermChange,
  searchQuery,
  onSearchQueryChange,
  hasMore,
  onLoadMore,
  isLoadingMore,
  showFiltered = false,
  onShowFilteredChange,
}: DealsPageProps) {
  // Count filtered deals using stored filter status
  const filteredCount = deals.filter(
    (d) => d.filterStatus && d.filterStatus !== 'passed'
  ).length;

  // Filter displayed deals based on toggle
  const displayedDeals = showFiltered
    ? deals
    : deals.filter((d) => !d.filterStatus || d.filterStatus === 'passed');

  return (
    <Stack gap="lg" data-testid="deals-page">
      <div>
        <Title order={2} data-testid="page-title">
          Deal History
        </Title>
        <Text c="dimmed">View processed deals and notification history</Text>
      </div>

      <DealStats
        totalDeals={stats.totalDeals}
        dealsToday={stats.dealsToday}
        topSearchTerm={stats.topSearchTerm}
      />

      <Group justify="space-between" align="flex-end">
        <DealFilters
          searchTerms={searchTerms}
          selectedSearchTerm={selectedSearchTerm}
          onSearchTermChange={onSearchTermChange}
          searchQuery={searchQuery}
          onSearchQueryChange={onSearchQueryChange}
        />
        {onShowFilteredChange && filteredCount > 0 && (
          <Group gap="xs">
            <Switch
              label="Show filtered"
              checked={showFiltered}
              onChange={(e) => onShowFilteredChange(e.currentTarget.checked)}
              data-testid="show-filtered-toggle"
            />
            <Badge variant="light" color="gray" size="sm">
              {filteredCount} filtered
            </Badge>
          </Group>
        )}
      </Group>

      {displayedDeals.length === 0 ? (
        <EmptyState
          title="No deals found"
          description={
            selectedSearchTerm || searchQuery
              ? "Try adjusting your filters to see more deals."
              : deals.length > 0 && !showFiltered
                ? "All deals were filtered out. Toggle 'Show filtered' to see them."
                : "Deals will appear here once the notifier processes them."
          }
        />
      ) : (
        <Stack gap="md" data-testid="deals-list">
          {displayedDeals.map((deal) => (
            <DealCard key={deal.id} {...deal} />
          ))}

          {hasMore && (
            <Center>
              <Button
                variant="light"
                onClick={onLoadMore}
                loading={isLoadingMore}
                data-testid="load-more-button"
              >
                Load More
              </Button>
            </Center>
          )}
        </Stack>
      )}
    </Stack>
  );
}
