import { describe, it, expect } from 'vitest';
import {
  computeMatchDetails,
  formatMatchSummary,
  serializeMatchDetails,
  deserializeMatchDetails,
} from './match-details';

describe('match-details', () => {
  describe('computeMatchDetails', () => {
    it('finds search term words in title', () => {
      const result = computeMatchDetails('NiteCore NB10000 Power Bank', 'Amazon', {
        searchTerm: 'NiteCore NB10000',
      });

      expect(result.searchTermMatches).toContain('NiteCore');
      expect(result.searchTermMatches).toContain('NB10000');
      expect(result.matchedSegments.length).toBeGreaterThan(0);
    });

    it('matches search term words found in title', () => {
      const result = computeMatchDetails('NiteCore Power Bank with 10000mAh Battery', 'Amazon', {
        searchTerm: 'NiteCore NB10000',
      });

      // Should find "NiteCore" as it appears in the title
      // "NB10000" won't match because it's not a substring of any word in title
      expect(result.searchTermMatches).toContain('NiteCore');
    });

    it('handles case insensitive matching by default', () => {
      const result = computeMatchDetails('NITECORE nb10000 power bank', undefined, {
        searchTerm: 'NiteCore NB10000',
      });

      expect(result.searchTermMatches).toContain('NiteCore');
      expect(result.searchTermMatches).toContain('NB10000');
    });

    it('respects case sensitive flag', () => {
      const result = computeMatchDetails('nitecore nb10000 power bank', undefined, {
        searchTerm: 'NiteCore NB10000',
        caseSensitive: true,
      });

      // Should not find matches when case doesn't match
      expect(result.searchTermMatches).not.toContain('NiteCore');
      expect(result.searchTermMatches).not.toContain('NB10000');
    });

    it('tracks include keyword matches', () => {
      const result = computeMatchDetails('NiteCore NB10000 Power Bank Pro', undefined, {
        searchTerm: 'NiteCore',
        includeKeywords: ['NB10000', 'Pro'],
      });

      expect(result.includeKeywordMatches).toContain('NB10000');
      expect(result.includeKeywordMatches).toContain('Pro');
    });

    it('reports missing include keywords', () => {
      const result = computeMatchDetails('NiteCore NB10000 Power Bank', undefined, {
        searchTerm: 'NiteCore',
        includeKeywords: ['NB10000', 'Pro', 'Max'],
      });

      expect(result.includeKeywordMatches).toContain('NB10000');
      expect(result.includeKeywordMatches).not.toContain('Pro');
      expect(result.includeKeywordMatches).not.toContain('Max');
    });

    it('reports exclude keyword status when none configured', () => {
      const result = computeMatchDetails('NiteCore NB10000', undefined, {
        searchTerm: 'NiteCore',
      });

      expect(result.excludeKeywordStatus).toBe('No exclude keywords configured');
    });

    it('reports exclude keyword status when configured but not found', () => {
      const result = computeMatchDetails('NiteCore NB10000', undefined, {
        searchTerm: 'NiteCore',
        excludeKeywords: ['refurbished', 'used'],
      });

      expect(result.excludeKeywordStatus).toContain('No excluded keywords found');
      expect(result.excludeKeywordStatus).toContain('refurbished');
    });

    it('reports when excluded keywords are found', () => {
      const result = computeMatchDetails('NiteCore NB10000 Refurbished', undefined, {
        searchTerm: 'NiteCore',
        excludeKeywords: ['refurbished', 'used'],
      });

      expect(result.excludeKeywordStatus).toContain('Contains excluded keywords');
      expect(result.excludeKeywordStatus).toContain('refurbished');
    });

    it('searches in merchant name as well', () => {
      const result = computeMatchDetails('Power Bank 10000mAh', 'NiteCore Official Store', {
        searchTerm: 'NiteCore',
      });

      expect(result.searchTermMatches).toContain('NiteCore');
      expect(result.matchedSegments.some((s) => s.position === 'merchant')).toBe(true);
    });

    it('creates matched segments with context', () => {
      const result = computeMatchDetails(
        'Amazing NiteCore NB10000 Power Bank Deal',
        undefined,
        { searchTerm: 'NB10000' }
      );

      const segment = result.matchedSegments.find((s) => s.matchedTerm === 'NB10000');
      expect(segment).toBeDefined();
      expect(segment?.text).toContain('[NB10000]');
      expect(segment?.text).toContain('NiteCore');
    });
  });

  describe('formatMatchSummary', () => {
    it('formats a summary with matched segments', () => {
      const details = computeMatchDetails('NiteCore NB10000 Power Bank', undefined, {
        searchTerm: 'NiteCore NB10000',
      });

      const summary = formatMatchSummary(details);
      expect(summary).toContain('matched');
    });

    it('formats a summary with include keywords', () => {
      const details = computeMatchDetails('NiteCore NB10000 Pro', undefined, {
        searchTerm: 'NiteCore',
        includeKeywords: ['NB10000', 'Pro'],
      });

      const summary = formatMatchSummary(details);
      expect(summary).toContain('Required keywords found');
    });

    it('returns fallback message when no matches found', () => {
      const details = computeMatchDetails('Random Product Title', undefined, {
        searchTerm: 'NiteCore NB10000',
      });

      const summary = formatMatchSummary(details);
      expect(summary).toContain('Returned by HotUKDeals');
    });
  });

  describe('serialization', () => {
    it('serializes and deserializes match details', () => {
      const original = computeMatchDetails('NiteCore NB10000', 'Amazon', {
        searchTerm: 'NiteCore NB10000',
        includeKeywords: ['NB10000'],
      });

      const serialized = serializeMatchDetails(original);
      const deserialized = deserializeMatchDetails(serialized);

      expect(deserialized).toEqual(original);
    });

    it('returns null for invalid JSON', () => {
      const result = deserializeMatchDetails('not valid json');
      expect(result).toBeNull();
    });
  });
});
