import { describe, it, expect } from 'vitest';
import {
  deserializeMatchDetails,
  computeMatchDetailsForDisplay,
  formatMatchDetailsForUI,
} from './match-details';
import type { MatchDetails } from '../../src/db/schemas';

describe('match-details frontend utilities', () => {
  describe('deserializeMatchDetails', () => {
    it('deserializes valid JSON', () => {
      const details: MatchDetails = {
        searchText: 'NiteCore NB10000 Amazon',
        matchedSegments: [
          { text: '...[NB10000]...', matchedTerm: 'NB10000', position: 'title' },
        ],
        searchTermMatches: ['NB10000'],
        includeKeywordMatches: [],
        excludeKeywordStatus: 'No exclude keywords configured',
        filterStatus: 'Matched "NB10000" from search term "NiteCore NB10000"',
      };

      const serialized = JSON.stringify(details);
      const result = deserializeMatchDetails(serialized);

      expect(result).toEqual(details);
    });

    it('returns null for undefined input', () => {
      expect(deserializeMatchDetails(undefined)).toBeNull();
    });

    it('returns null for null input', () => {
      expect(deserializeMatchDetails(null)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(deserializeMatchDetails('')).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      expect(deserializeMatchDetails('not valid json')).toBeNull();
    });
  });

  describe('computeMatchDetailsForDisplay', () => {
    it('computes match details from title and search term', () => {
      const result = computeMatchDetailsForDisplay(
        'NiteCore NB10000 Power Bank',
        'Amazon',
        'NiteCore NB10000'
      );

      expect(result.searchText).toBe('NiteCore NB10000 Power Bank Amazon');
      expect(result.searchTermMatches).toContain('NiteCore');
      expect(result.searchTermMatches).toContain('NB10000');
    });

    it('matches search term words found in title', () => {
      const result = computeMatchDetailsForDisplay(
        'NiteCore Power Bank with 10000mAh',
        'Amazon',
        'NiteCore NB10000'
      );

      // Should find "NiteCore" as it appears in the title
      expect(result.searchTermMatches).toContain('NiteCore');
    });

    it('handles undefined merchant', () => {
      const result = computeMatchDetailsForDisplay(
        'NiteCore NB10000',
        undefined,
        'NiteCore'
      );

      expect(result.searchText).toBe('NiteCore NB10000');
      expect(result.searchTermMatches).toContain('NiteCore');
    });

    it('creates matched segments with context', () => {
      const result = computeMatchDetailsForDisplay(
        'Amazing NiteCore NB10000 Power Bank',
        undefined,
        'NB10000'
      );

      expect(result.matchedSegments.length).toBeGreaterThan(0);
      expect(result.matchedSegments[0].text).toContain('[NB10000]');
    });

    it('sets appropriate filter status for old records', () => {
      const result = computeMatchDetailsForDisplay(
        'NiteCore NB10000',
        undefined,
        'NiteCore NB10000'
      );

      expect(result.excludeKeywordStatus).toContain('not available');
      expect(result.includeKeywordMatches).toEqual([]);
    });
  });

  describe('formatMatchDetailsForUI', () => {
    it('formats details with matched terms', () => {
      const details: MatchDetails = {
        searchText: 'NiteCore NB10000 Amazon',
        matchedSegments: [
          { text: '...[NB10000]...', matchedTerm: 'NB10000', position: 'title' },
        ],
        searchTermMatches: ['NB10000', 'NiteCore'],
        includeKeywordMatches: [],
        excludeKeywordStatus: 'No exclude keywords configured',
        filterStatus: 'Matched',
      };

      const result = formatMatchDetailsForUI(details);

      expect(result.summary).toContain('NB10000');
      expect(result.summary).toContain('NiteCore');
      expect(result.segments.length).toBe(1);
      expect(result.segments[0].location).toBe('in title');
    });

    it('formats details with include keyword matches', () => {
      const details: MatchDetails = {
        searchText: 'NiteCore NB10000 Pro Amazon',
        matchedSegments: [],
        searchTermMatches: ['NiteCore'],
        includeKeywordMatches: ['NB10000', 'Pro'],
        excludeKeywordStatus: 'No exclude keywords configured',
        filterStatus: 'Matched',
      };

      const result = formatMatchDetailsForUI(details);

      expect(result.filterInfo).toContain('Required keywords found');
      expect(result.filterInfo).toContain('NB10000');
      expect(result.filterInfo).toContain('Pro');
    });

    it('returns fallback summary when no matches', () => {
      const details: MatchDetails = {
        searchText: 'Random Product',
        matchedSegments: [],
        searchTermMatches: [],
        includeKeywordMatches: [],
        excludeKeywordStatus: 'No exclude keywords configured',
        filterStatus: 'No match',
      };

      const result = formatMatchDetailsForUI(details);

      expect(result.summary).toBe('Returned by HotUKDeals search');
    });

    it('formats merchant position correctly', () => {
      const details: MatchDetails = {
        searchText: 'Power Bank NiteCore Store',
        matchedSegments: [
          { text: '...[NiteCore]...', matchedTerm: 'NiteCore', position: 'merchant' },
        ],
        searchTermMatches: ['NiteCore'],
        includeKeywordMatches: [],
        excludeKeywordStatus: 'No exclude keywords configured',
        filterStatus: 'Matched',
      };

      const result = formatMatchDetailsForUI(details);

      expect(result.segments[0].location).toBe('in merchant');
    });

    it('shows no filters message when appropriate', () => {
      const details: MatchDetails = {
        searchText: 'NiteCore NB10000',
        matchedSegments: [],
        searchTermMatches: ['NiteCore'],
        includeKeywordMatches: [],
        excludeKeywordStatus: 'Filter info not available (old record)',
        filterStatus: 'Matched',
      };

      const result = formatMatchDetailsForUI(details);

      expect(result.filterInfo).toBe('No keyword filters were applied');
    });
  });
});
