/**
 * Client-side deal filtering utility
 *
 * Provides real-time filter evaluation for deals based on configurable
 * filter criteria. This mirrors the server-side filterDeal logic from
 * src/notifier.ts to allow live preview of filter settings.
 */

export type FilterStatus = 'passed' | 'filtered_no_match' | 'filtered_exclude' | 'filtered_include';

export interface FilterConfig {
  searchTerm: string;
  includeKeywords: string[];
  excludeKeywords: string[];
  caseSensitive: boolean;
}

export interface FilterResult {
  passed: boolean;
  filterStatus: FilterStatus;
  filterReason?: string;
}

export interface Deal {
  id: string;
  title: string;
  merchant?: string;
  searchTerm: string;
}

/**
 * Applies filter configuration to a deal and returns the filter result.
 * This mirrors the server-side filterDeal logic for client-side preview.
 */
export function applyFilter(deal: Deal, config: FilterConfig): FilterResult {
  const title = config.caseSensitive ? deal.title : deal.title.toLowerCase();
  const merchant = config.caseSensitive ? (deal.merchant || '') : (deal.merchant || '').toLowerCase();

  // Combine title and merchant for filtering
  const searchText = `${title} ${merchant}`.trim();

  // Check that at least one search term word appears in the deal
  const searchTermWords = config.searchTerm.split(/\s+/).filter((w) => w.length > 0);
  const normalizedSearchTermWords = config.caseSensitive
    ? searchTermWords
    : searchTermWords.map((w) => w.toLowerCase());

  const hasSearchTermMatch = normalizedSearchTermWords.some((word) => searchText.includes(word));

  if (!hasSearchTermMatch) {
    return {
      passed: false,
      filterStatus: 'filtered_no_match',
      filterReason: `No words from search term "${config.searchTerm}" found in deal`,
    };
  }

  // Check exclude keywords
  if (config.excludeKeywords && config.excludeKeywords.length > 0) {
    const excludeWords = config.caseSensitive
      ? config.excludeKeywords
      : config.excludeKeywords.map((keyword) => keyword.toLowerCase());

    const matchedExclude = excludeWords.find((keyword) => searchText.includes(keyword));
    if (matchedExclude) {
      return {
        passed: false,
        filterStatus: 'filtered_exclude',
        filterReason: `Excluded keyword "${matchedExclude}" found in deal`,
      };
    }
  }

  // Check include keywords (all must be present if specified)
  if (config.includeKeywords && config.includeKeywords.length > 0) {
    const includeWords = config.caseSensitive
      ? config.includeKeywords
      : config.includeKeywords.map((keyword) => keyword.toLowerCase());

    const missingKeywords = includeWords.filter((keyword) => !searchText.includes(keyword));
    if (missingKeywords.length > 0) {
      return {
        passed: false,
        filterStatus: 'filtered_include',
        filterReason: `Required keyword(s) not found: ${missingKeywords.join(', ')}`,
      };
    }
  }

  return { passed: true, filterStatus: 'passed' };
}

/**
 * Applies filter configuration to multiple deals
 */
export function applyFilterToDeals<T extends Deal>(
  deals: T[],
  config: FilterConfig
): Array<T & { liveFilterStatus: FilterStatus; liveFilterReason?: string }> {
  return deals.map((deal) => {
    const result = applyFilter(deal, config);
    return {
      ...deal,
      liveFilterStatus: result.filterStatus,
      liveFilterReason: result.filterReason,
    };
  });
}
