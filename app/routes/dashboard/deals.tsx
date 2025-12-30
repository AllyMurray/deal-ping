import { useState } from "react";
import { useSearchParams, useFetcher } from "react-router";
import type { Route } from "./+types/deals";
import { DealsPage } from "~/pages/dashboard";
import { RouteErrorBoundary } from "~/components/ui";
import { requireUser } from "~/lib/auth";
import {
  getConfigsByUser,
  getDealsBySearchTerm,
  getBookmarksByUser,
  createBookmark,
  deleteBookmarkByDeal,
  getDeal,
} from "~/db/repository.server";
import type { DateRange } from "~/components/deals";

/**
 * Converts a date range option to a timestamp for database queries.
 * Returns the start timestamp for the selected range.
 */
function getDateRangeStartTime(dateRange: DateRange): number | undefined {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  switch (dateRange) {
    case "today": {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      return startOfDay.getTime();
    }
    case "7days":
      return now - 7 * day;
    case "30days":
      return now - 30 * day;
    case "all":
      return undefined; // No filter
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireUser(request);
  const url = new URL(request.url);
  const searchTermFilter = url.searchParams.get("searchTerm");
  const dateRangeParam = url.searchParams.get("dateRange") as DateRange | null;
  const dateRange: DateRange = dateRangeParam || "7days";
  const limit = 50;

  // Get unique search terms for THIS user only and bookmarked deal IDs in parallel
  const [configs, bookmarks] = await Promise.all([
    getConfigsByUser({ userId: user.id }),
    getBookmarksByUser({ userId: user.id }),
  ]);

  const allSearchTerms = [...new Set(configs.map((c) => c.searchTerm))];
  const bookmarkedDealIds = bookmarks.map((b) => b.dealId);

  // Determine which search terms to query
  const searchTermsToQuery = searchTermFilter
    ? [searchTermFilter]
    : allSearchTerms;

  // Calculate date range for efficient queries
  const startTime = getDateRangeStartTime(dateRange);

  // Query deals using efficient GSI queries (no table scan!)
  // Each search term query uses the bySearchTerm GSI with timestamp in sort key
  const dealPromises = searchTermsToQuery.map((term) =>
    getDealsBySearchTerm({
      searchTerm: term,
      startTime,
      limit: 100, // Get more per term, we'll trim after merging
    })
  );
  const dealResults = await Promise.all(dealPromises);
  let deals = dealResults.flat();

  // Sort merged results by timestamp descending
  deals.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const totalDealsInRange = deals.length;
  const hasMore = deals.length > limit;
  if (hasMore) {
    deals = deals.slice(0, limit);
  }

  // Calculate stats
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayTime = startOfDay.getTime();

  const dealsToday = deals.filter(
    (d) => d.timestamp && d.timestamp >= startOfDayTime
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
      notified: d.notified,
    })),
    stats: {
      totalDeals: totalDealsInRange,
      dealsToday,
      topSearchTerm,
    },
    searchTerms: allSearchTerms,
    dateRange,
    hasMore,
    bookmarkedDealIds,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { user } = await requireUser(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const dealId = formData.get("dealId") as string;

  if (intent === "bookmark") {
    // Get the deal to bookmark
    const deal = await getDeal({ id: dealId });
    if (!deal) {
      return { error: "Deal not found" };
    }

    await createBookmark({
      userId: user.id,
      dealId: deal.dealId,
      title: deal.title,
      link: deal.link,
      price: deal.price,
      merchant: deal.merchant,
      searchTerm: deal.searchTerm,
    });

    return { success: true, bookmarked: true, dealId };
  }

  if (intent === "unbookmark") {
    await deleteBookmarkByDeal({ userId: user.id, dealId });
    return { success: true, bookmarked: false, dealId };
  }

  return { error: "Invalid intent" };
}

export default function Deals({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("searchTerm");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFiltered, setShowFiltered] = useState(false);
  const bookmarkFetcher = useFetcher();

  // Track bookmarked deal IDs with optimistic updates
  const bookmarkedDealIds = new Set(loaderData.bookmarkedDealIds);

  // Apply optimistic update if a bookmark operation is in progress
  if (bookmarkFetcher.formData) {
    const dealId = bookmarkFetcher.formData.get("dealId") as string;
    const intent = bookmarkFetcher.formData.get("intent") as string;
    if (intent === "bookmark") {
      bookmarkedDealIds.add(dealId);
    } else if (intent === "unbookmark") {
      bookmarkedDealIds.delete(dealId);
    }
  }

  // Get the deal ID currently being processed
  const bookmarkLoadingId = bookmarkFetcher.state !== "idle"
    ? (bookmarkFetcher.formData?.get("dealId") as string)
    : undefined;

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

  const handleSearchTermChange = (value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set("searchTerm", value);
    } else {
      newParams.delete("searchTerm");
    }
    setSearchParams(newParams);
  };

  const handleDateRangeChange = (value: DateRange) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("dateRange", value);
    setSearchParams(newParams);
  };

  const handleBookmarkToggle = (dealId: string, bookmark: boolean) => {
    bookmarkFetcher.submit(
      { intent: bookmark ? "bookmark" : "unbookmark", dealId },
      { method: "POST" }
    );
  };

  return (
    <DealsPage
      deals={filteredDeals}
      stats={loaderData.stats}
      searchTerms={loaderData.searchTerms}
      selectedSearchTerm={searchTerm}
      onSearchTermChange={handleSearchTermChange}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      dateRange={loaderData.dateRange}
      onDateRangeChange={handleDateRangeChange}
      hasMore={loaderData.hasMore}
      onLoadMore={() => {
        // Simple implementation - could be improved with cursor-based pagination
        console.log("Load more not yet implemented");
      }}
      showFiltered={showFiltered}
      onShowFilteredChange={setShowFiltered}
      bookmarkedDealIds={bookmarkedDealIds}
      onBookmarkToggle={handleBookmarkToggle}
      bookmarkLoadingId={bookmarkLoadingId}
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
