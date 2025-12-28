import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import type { Route } from "./+types/deals";
import { DealsPage, type FilterConfigState } from "~/pages/dashboard";
import { RouteErrorBoundary } from "~/components/ui";
import { requireUser } from "~/lib/auth";
import { getConfigsByUser } from "~/db/repository.server";
import { HotUKDealsService } from "../../../src/db/service";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireUser(request);
  const url = new URL(request.url);
  const searchTermFilter = url.searchParams.get("searchTerm");
  const limit = 50;

  // Get unique search terms for THIS user only
  const configs = await getConfigsByUser({ userId: user.id });
  const searchTerms = [...new Set(configs.map((c) => c.searchTerm))];

  // Query deals - using ElectroDB scan for now (pagination would need GSI)
  const query = HotUKDealsService.entities.deal.scan;

  const result = await query.go({ limit: 500 }); // Get more to filter

  // Filter deals to only those matching user's search terms
  let deals = result.data.filter((d) => searchTerms.includes(d.searchTerm));

  // Further filter by specific search term if specified
  if (searchTermFilter) {
    deals = deals.filter((d) => d.searchTerm === searchTermFilter);
  }

  // Sort by timestamp descending
  deals.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const hasMore = deals.length > limit;
  if (hasMore) {
    deals = deals.slice(0, limit);
  }

  // Calculate stats
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  const dealsToday = deals.filter(
    (d) => d.timestamp && d.timestamp >= startOfDay
  ).length;

  // Count deals by search term
  const dealsBySearchTerm: Record<string, number> = {};
  deals.forEach((d) => {
    dealsBySearchTerm[d.searchTerm] =
      (dealsBySearchTerm[d.searchTerm] || 0) + 1;
  });

  const topSearchTerm = Object.entries(dealsBySearchTerm).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  // Create a map of search term -> config for filter preview
  const configsBySearchTerm: Record<string, {
    includeKeywords: string[];
    excludeKeywords: string[];
    caseSensitive: boolean;
  }> = {};

  configs.forEach((c) => {
    configsBySearchTerm[c.searchTerm] = {
      includeKeywords: c.includeKeywords || [],
      excludeKeywords: c.excludeKeywords || [],
      caseSensitive: c.caseSensitive ?? false,
    };
  });

  return {
    deals: deals.map((d) => ({
      id: d.dealId,
      title: d.title,
      link: d.link,
      price: d.price,
      merchant: d.merchant,
      searchTerm: d.searchTerm,
      timestamp: d.timestamp,
      matchDetails: d.matchDetails,
      filterStatus: d.filterStatus,
      filterReason: d.filterReason,
    })),
    stats: {
      totalDeals: result.data.length,
      dealsToday,
      topSearchTerm,
    },
    searchTerms,
    hasMore,
    configsBySearchTerm,
  };
}

export default function Deals({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("searchTerm");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFiltered, setShowFiltered] = useState(true); // Default to showing filtered deals

  // Initialize filter config state from saved config
  const savedConfig = searchTerm ? loaderData.configsBySearchTerm[searchTerm] : undefined;
  const [filterConfigOverrides, setFilterConfigOverrides] = useState<Partial<FilterConfigState>>({});

  // Merge saved config with local overrides
  const filterConfig = useMemo((): FilterConfigState | undefined => {
    if (!searchTerm) return undefined;

    const saved = savedConfig || {
      includeKeywords: [],
      excludeKeywords: [],
      caseSensitive: false,
    };

    return {
      searchTerm,
      includeKeywords: filterConfigOverrides.includeKeywords ?? saved.includeKeywords,
      excludeKeywords: filterConfigOverrides.excludeKeywords ?? saved.excludeKeywords,
      caseSensitive: filterConfigOverrides.caseSensitive ?? saved.caseSensitive,
    };
  }, [searchTerm, savedConfig, filterConfigOverrides]);

  // Reset overrides when search term changes
  const handleSearchTermChange = useCallback((value: string | null) => {
    setFilterConfigOverrides({}); // Reset overrides
    if (value) {
      setSearchParams({ searchTerm: value });
    } else {
      setSearchParams({});
    }
  }, [setSearchParams]);

  // Handle filter config changes
  const handleFilterConfigChange = useCallback((changes: Partial<FilterConfigState>) => {
    setFilterConfigOverrides((prev: Partial<FilterConfigState>) => ({ ...prev, ...changes }));
  }, []);

  // Filter deals client-side for search query
  const filteredDeals = loaderData.deals.filter((deal) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        deal.title.toLowerCase().includes(query) ||
        deal.merchant?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <DealsPage
      deals={filteredDeals}
      stats={loaderData.stats}
      searchTerms={loaderData.searchTerms}
      selectedSearchTerm={searchTerm}
      onSearchTermChange={handleSearchTermChange}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      hasMore={loaderData.hasMore}
      onLoadMore={() => {
        // Simple implementation - could be improved with cursor-based pagination
        console.log("Load more not yet implemented");
      }}
      showFiltered={showFiltered}
      onShowFilteredChange={setShowFiltered}
      filterConfig={filterConfig}
      onFilterConfigChange={handleFilterConfigChange}
    />
  );
}

export function ErrorBoundary() {
  return (
    <RouteErrorBoundary
      backPath="/dashboard"
      backLabel="Back to Dashboard"
      errorMessage="Failed to load deals. Please try again."
    />
  );
}
