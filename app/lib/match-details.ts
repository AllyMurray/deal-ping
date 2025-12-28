/**
 * Match details utility functions for the frontend
 *
 * These functions help display and compute match information for deals.
 */

import type { MatchSegment, MatchDetails } from '../../src/db/schemas';

export type { MatchSegment, MatchDetails };

/**
 * Deserializes match details from storage
 */
export function deserializeMatchDetails(serialized: string | undefined | null): MatchDetails | null {
  if (!serialized) return null;
  try {
    return JSON.parse(serialized) as MatchDetails;
  } catch {
    return null;
  }
}

/**
 * Extracts a text segment around a matched term with context
 */
function extractSegment(
  text: string,
  matchedTerm: string,
  contextChars: number = 20
): string {
  const searchText = text.toLowerCase();
  const searchTerm = matchedTerm.toLowerCase();

  const index = searchText.indexOf(searchTerm);
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
function findSearchTermMatches(dealText: string, searchTerm: string): string[] {
  const searchWords = searchTerm.split(/\s+/).filter((w) => w.length > 0);
  const textToSearch = dealText.toLowerCase();

  const matches: string[] = [];

  for (const word of searchWords) {
    const wordToFind = word.toLowerCase();
    if (textToSearch.includes(wordToFind)) {
      matches.push(word);
    }
  }

  return matches;
}

/**
 * Computes match details for old records that don't have stored match details
 * Uses only title, merchant, and searchTerm (no filter info available)
 */
export function computeMatchDetailsForDisplay(
  title: string,
  merchant: string | undefined,
  searchTerm: string
): MatchDetails {
  const searchText = `${title} ${merchant || ''}`.trim();
  const matchedSegments: MatchSegment[] = [];
  const searchTermMatches = findSearchTermMatches(searchText, searchTerm);

  // Find segments matching search term words
  for (const match of searchTermMatches) {
    const segment = extractSegment(title, match);
    if (segment) {
      matchedSegments.push({
        text: segment,
        matchedTerm: match,
        position: 'title',
      });
    } else if (merchant) {
      const merchantSegment = extractSegment(merchant, match);
      if (merchantSegment) {
        matchedSegments.push({
          text: merchantSegment,
          matchedTerm: match,
          position: 'merchant',
        });
      }
    }
  }

  // Build filter status
  let filterStatus = '';
  if (searchTermMatches.length > 0) {
    filterStatus = `Matched "${searchTermMatches.join('", "')}" from search term "${searchTerm}"`;
  } else {
    filterStatus = `Returned by HotUKDeals for search term "${searchTerm}"`;
  }

  return {
    searchText,
    matchedSegments,
    searchTermMatches,
    includeKeywordMatches: [], // Not available for old records
    excludeKeywordStatus: 'Filter info not available (old record)',
    filterStatus,
  };
}

/**
 * Formats match details for display
 */
export function formatMatchDetailsForUI(details: MatchDetails): {
  summary: string;
  segments: Array<{ text: string; matchedTerm: string; location: string }>;
  filterInfo: string;
} {
  // Create summary
  let summary = '';
  if (details.searchTermMatches.length > 0) {
    summary = `Matched: ${details.searchTermMatches.join(', ')}`;
  } else {
    summary = 'Returned by HotUKDeals search';
  }

  // Format segments
  const segments = details.matchedSegments.map((seg) => ({
    text: seg.text,
    matchedTerm: seg.matchedTerm,
    location: seg.position === 'title' ? 'in title' : 'in merchant',
  }));

  // Filter info
  let filterInfo = '';
  if (details.includeKeywordMatches.length > 0) {
    filterInfo = `Required keywords found: ${details.includeKeywordMatches.join(', ')}`;
  }
  if (details.excludeKeywordStatus && !details.excludeKeywordStatus.includes('not available')) {
    if (filterInfo) filterInfo += '. ';
    filterInfo += details.excludeKeywordStatus;
  }
  if (!filterInfo) {
    filterInfo = 'No keyword filters were applied';
  }

  return { summary, segments, filterInfo };
}
