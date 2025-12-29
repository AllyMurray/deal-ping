/**
 * Client-side deal filtering utility
 *
 * Provides real-time filter evaluation for deals based on configurable
 * filter criteria. This mirrors the server-side filterDeal logic from
 * src/notifier.ts to allow live preview of filter settings.
 */

import { z } from 'zod';
import {
  type MatchSegment,
  MatchDetails,
  type DealFilterStatus,
} from '../../src/db/schemas';

// Re-export for convenience and use within this file
export type FilterStatus = DealFilterStatus;

// FilterConfig for client-side filter settings
export const FilterConfig = z.object({
  searchTerm: z.string(),
  includeKeywords: z.array(z.string()),
  excludeKeywords: z.array(z.string()),
  caseSensitive: z.boolean(),
});

export type FilterConfig = z.infer<typeof FilterConfig>;

// FilterResult for filter evaluation results
export const FilterResult = z.object({
  passed: z.boolean(),
  filterStatus: z.enum(['passed', 'filtered_no_match', 'filtered_exclude', 'filtered_include']),
  filterReason: z.string().optional(),
  matchDetails: MatchDetails,
});

export type FilterResult = z.infer<typeof FilterResult>;

// FilterDeal for filter input
export const FilterDeal = z.object({
  id: z.string(),
  title: z.string(),
  merchant: z.string().optional(),
  searchTerm: z.string(),
});

export type FilterDeal = z.infer<typeof FilterDeal>;

// Alias for backwards compatibility
export type Deal = FilterDeal;

/**
 * Extracts a text segment around a matched term with context
 */
function extractSegment(
  text: string,
  matchedTerm: string,
  caseSensitive: boolean,
  contextChars: number = 20
): string {
  const searchText = caseSensitive ? text : text.toLowerCase();
  const termToFind = caseSensitive ? matchedTerm : matchedTerm.toLowerCase();

  const index = searchText.indexOf(termToFind);
  if (index === -1) return '';

  const start = Math.max(0, index - contextChars);
  const end = Math.min(text.length, index + matchedTerm.length + contextChars);

  let segment = '';
  if (start > 0) segment += '...';
  segment += text.substring(start, index);
  segment += `[${text.substring(index, index + matchedTerm.length)}]`;
  segment += text.substring(index + matchedTerm.length, end);
  if (end < text.length) segment += '...';

  return segment;
}

/**
 * Finds all matching terms from a search query in the deal text
 */
function findSearchTermMatches(
  dealText: string,
  searchTerm: string,
  caseSensitive: boolean
): string[] {
  const searchWords = searchTerm.split(/\s+/).filter((w) => w.length > 0);
  const textToSearch = caseSensitive ? dealText : dealText.toLowerCase();

  const matches: string[] = [];

  for (const word of searchWords) {
    const wordToFind = caseSensitive ? word : word.toLowerCase();
    if (textToSearch.includes(wordToFind)) {
      matches.push(word);
    }
  }

  return matches;
}

/**
 * Computes detailed match information for a deal against filter config
 */
function computeMatchDetails(
  title: string,
  merchant: string | undefined,
  config: FilterConfig
): MatchDetails {
  const caseSensitive = config.caseSensitive;
  const searchText = `${title} ${merchant || ''}`.trim();
  const normalizedSearchText = caseSensitive ? searchText : searchText.toLowerCase();

  const matchedSegments: MatchSegment[] = [];
  const searchTermMatches = findSearchTermMatches(searchText, config.searchTerm, caseSensitive);
  const includeKeywordMatches: string[] = [];

  // Find segments matching search term words
  for (const match of searchTermMatches) {
    const segment = extractSegment(title, match, caseSensitive);
    if (segment) {
      matchedSegments.push({
        text: segment,
        matchedTerm: match,
        position: 'title',
      });
    } else if (merchant) {
      const merchantSegment = extractSegment(merchant, match, caseSensitive);
      if (merchantSegment) {
        matchedSegments.push({
          text: merchantSegment,
          matchedTerm: match,
          position: 'merchant',
        });
      }
    }
  }

  // Check include keywords
  let includeStatus = '';
  if (config.includeKeywords && config.includeKeywords.length > 0) {
    for (const keyword of config.includeKeywords) {
      const keywordToFind = caseSensitive ? keyword : keyword.toLowerCase();
      if (normalizedSearchText.includes(keywordToFind)) {
        includeKeywordMatches.push(keyword);

        // Add segment for this keyword match
        const segment = extractSegment(title, keyword, caseSensitive);
        if (segment) {
          matchedSegments.push({
            text: segment,
            matchedTerm: keyword,
            position: 'title',
          });
        } else if (merchant) {
          const merchantSegment = extractSegment(merchant, keyword, caseSensitive);
          if (merchantSegment) {
            matchedSegments.push({
              text: merchantSegment,
              matchedTerm: keyword,
              position: 'merchant',
            });
          }
        }
      }
    }

    if (includeKeywordMatches.length === config.includeKeywords.length) {
      includeStatus = `All required keywords found: ${includeKeywordMatches.join(', ')}`;
    } else {
      const missing = config.includeKeywords.filter((k) => !includeKeywordMatches.includes(k));
      includeStatus = `Missing required keywords: ${missing.join(', ')}`;
    }
  } else {
    includeStatus = 'No include keywords configured';
  }

  // Check exclude keywords
  let excludeKeywordStatus = '';
  if (config.excludeKeywords && config.excludeKeywords.length > 0) {
    const excludedFound: string[] = [];
    for (const keyword of config.excludeKeywords) {
      const keywordToFind = caseSensitive ? keyword : keyword.toLowerCase();
      if (normalizedSearchText.includes(keywordToFind)) {
        excludedFound.push(keyword);
      }
    }

    if (excludedFound.length > 0) {
      excludeKeywordStatus = `Contains excluded keywords: ${excludedFound.join(', ')}`;
    } else {
      excludeKeywordStatus = `No excluded keywords found (checked: ${config.excludeKeywords.join(', ')})`;
    }
  } else {
    excludeKeywordStatus = 'No exclude keywords configured';
  }

  // Build filter status
  let filterStatus = '';
  if (searchTermMatches.length > 0) {
    filterStatus = `Matched "${searchTermMatches.join('", "')}" from search term "${config.searchTerm}"`;
  } else {
    filterStatus = `No direct match found for search term "${config.searchTerm}"`;
  }

  return {
    searchText,
    matchedSegments,
    searchTermMatches,
    includeKeywordMatches,
    excludeKeywordStatus,
    filterStatus,
  };
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

  // Compute match details regardless of filter outcome
  const matchDetails = computeMatchDetails(deal.title, deal.merchant, config);

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
      matchDetails,
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
        matchDetails,
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
        matchDetails,
      };
    }
  }

  return { passed: true, filterStatus: 'passed', matchDetails };
}

/**
 * Applies filter configuration to multiple deals
 */
export function applyFilterToDeals<T extends Deal>(
  deals: T[],
  config: FilterConfig
): Array<T & { liveFilterStatus: FilterStatus; liveFilterReason?: string; liveMatchDetails: MatchDetails }> {
  return deals.map((deal) => {
    const result = applyFilter(deal, config);
    return {
      ...deal,
      liveFilterStatus: result.filterStatus,
      liveFilterReason: result.filterReason,
      liveMatchDetails: result.matchDetails,
    };
  });
}

export type { MatchDetails };
