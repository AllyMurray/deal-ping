/**
 * Match details utility functions
 *
 * Provides functionality to compute and explain why a deal matched
 * a search term configuration.
 */

import type { MatchSegment, MatchDetails, MatchFilterConfig } from './db/schemas';

export type { MatchSegment, MatchDetails, MatchFilterConfig };

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
  const searchTerm = caseSensitive ? matchedTerm : matchedTerm.toLowerCase();

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
 * Finds matching terms from a search query in the deal text
 * When fuzzyMatch is true, returns all matching words from the search term
 * When fuzzyMatch is false (default), returns the search term if the entire phrase is found
 */
function findSearchTermMatches(
  dealText: string,
  searchTerm: string,
  caseSensitive: boolean,
  fuzzyMatch: boolean = false
): string[] {
  const textToSearch = caseSensitive ? dealText : dealText.toLowerCase();

  if (fuzzyMatch) {
    // Fuzzy match: find all matching words
    const searchWords = searchTerm.split(/\s+/).filter((w) => w.length > 0);
    const matches: string[] = [];

    for (const word of searchWords) {
      const wordToFind = caseSensitive ? word : word.toLowerCase();
      if (textToSearch.includes(wordToFind)) {
        matches.push(word);
      }
    }

    return matches;
  } else {
    // Exact phrase match: entire search term must be present
    const termToFind = caseSensitive ? searchTerm : searchTerm.toLowerCase();

    if (textToSearch.includes(termToFind)) {
      return [searchTerm];
    }

    return [];
  }
}

/**
 * Computes detailed match information for a deal
 */
export function computeMatchDetails(
  title: string,
  merchant: string | undefined,
  config: MatchFilterConfig
): MatchDetails {
  const caseSensitive = config.caseSensitive ?? false;
  const fuzzyMatch = config.fuzzyMatch ?? false;
  const searchText = `${title} ${merchant || ''}`.trim();
  const normalizedSearchText = caseSensitive ? searchText : searchText.toLowerCase();

  const matchedSegments: MatchSegment[] = [];
  const searchTermMatches = findSearchTermMatches(searchText, config.searchTerm, caseSensitive, fuzzyMatch);
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
      includeStatus = `Missing required keywords: ${config.includeKeywords
        .filter((k) => !includeKeywordMatches.includes(k))
        .join(', ')}`;
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
 * Generates a human-readable summary of match details
 * Suitable for Discord notifications or UI display
 */
export function formatMatchSummary(details: MatchDetails): string {
  const parts: string[] = [];

  // Show what matched
  if (details.matchedSegments.length > 0) {
    const firstMatch = details.matchedSegments[0];
    parts.push(`"${firstMatch.text}" matched "${firstMatch.matchedTerm}"`);
  } else if (details.searchTermMatches.length > 0) {
    parts.push(`Matched: ${details.searchTermMatches.join(', ')}`);
  }

  // Show filter info if relevant
  if (details.includeKeywordMatches.length > 0) {
    parts.push(`Required keywords found: ${details.includeKeywordMatches.join(', ')}`);
  }

  if (parts.length === 0) {
    parts.push('Returned by HotUKDeals search');
  }

  return parts.join('. ');
}

/**
 * Serializes match details for storage in DynamoDB
 */
export function serializeMatchDetails(details: MatchDetails): string {
  return JSON.stringify(details);
}

/**
 * Deserializes match details from DynamoDB storage
 */
export function deserializeMatchDetails(serialized: string): MatchDetails | null {
  try {
    return JSON.parse(serialized) as MatchDetails;
  } catch {
    return null;
  }
}
