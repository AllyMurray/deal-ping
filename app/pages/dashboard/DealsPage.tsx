import { useMemo } from "react";
import { Title, Text, Stack, Button, Group, Center, Switch, Badge } from "@mantine/core";
import { DealCard, DealFilters, DealStats, FilterConfigPanel, type DealCardProps } from "~/components/deals";
import { EmptyState } from "~/components/ui";
import { applyFilter, type FilterConfig } from "~/lib/deal-filter";

export interface FilterConfigState {
  searchTerm: string;
  includeKeywords: string[];
  excludeKeywords: string[];
  caseSensitive: boolean;
}

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
  // Live filter configuration
  filterConfig?: FilterConfigState;
  onFilterConfigChange?: (config: Partial<FilterConfigState>) => void;
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
  filterConfig,
  onFilterConfigChange,
}: DealsPageProps) {
  // Apply live filtering when a filter config is provided
  const dealsWithLiveFilter = useMemo(() => {
    if (!filterConfig || !selectedSearchTerm) {
      // No live filter - use stored filter status
      return deals.map((deal) => ({
        ...deal,
        liveFilterStatus: deal.filterStatus,
        liveFilterReason: deal.filterReason,
      }));
    }

    // Apply live filter to deals matching the selected search term
    return deals.map((deal) => {
      if (deal.searchTerm !== selectedSearchTerm) {
        // For deals with different search terms, use stored status
        return {
          ...deal,
          liveFilterStatus: deal.filterStatus,
          liveFilterReason: deal.filterReason,
        };
      }

      // Apply live filter
      const result = applyFilter(
        { id: deal.id, title: deal.title, merchant: deal.merchant, searchTerm: deal.searchTerm },
        filterConfig
      );
      return {
        ...deal,
        liveFilterStatus: result.filterStatus,
        liveFilterReason: result.filterReason,
      };
    });
  }, [deals, filterConfig, selectedSearchTerm]);

  // Count filtered deals based on live filter status
  const filteredCount = dealsWithLiveFilter.filter(
    (d) => d.liveFilterStatus && d.liveFilterStatus !== 'passed'
  ).length;
  const passedCount = dealsWithLiveFilter.length - filteredCount;

  // Filter displayed deals based on toggle, using live filter status
  const displayedDeals = showFiltered
    ? dealsWithLiveFilter
    : dealsWithLiveFilter.filter((d) => !d.liveFilterStatus || d.liveFilterStatus === 'passed');

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

      {/* Filter Configuration Panel - shown when a search term is selected */}
      {selectedSearchTerm && filterConfig && onFilterConfigChange && (
        <FilterConfigPanel
          searchTerm={selectedSearchTerm}
          includeKeywords={filterConfig.includeKeywords}
          excludeKeywords={filterConfig.excludeKeywords}
          caseSensitive={filterConfig.caseSensitive}
          onIncludeKeywordsChange={(keywords) => onFilterConfigChange({ includeKeywords: keywords })}
          onExcludeKeywordsChange={(keywords) => onFilterConfigChange({ excludeKeywords: keywords })}
          onCaseSensitiveChange={(value) => onFilterConfigChange({ caseSensitive: value })}
          passedCount={passedCount}
          filteredCount={filteredCount}
        />
      )}

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
            <DealCard
              key={deal.id}
              {...deal}
              filterStatus={deal.liveFilterStatus}
              filterReason={deal.liveFilterReason}
            />
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
