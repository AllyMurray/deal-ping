import { describe, it, expect } from 'vitest';
import { filterDeal, FilterResult, FilterStatus } from './notifier';
import type { Deal } from './feed-parser';
import type { SearchTermConfig } from './db';

// Helper to create a minimal Deal for testing
const createDeal = (overrides: Partial<Deal> = {}): Deal => ({
  id: 'deal-123',
  title: 'Test Deal Title',
  link: 'https://example.com/deal',
  ...overrides,
});

// Helper to create a minimal SearchTermConfig for testing
const createConfig = (overrides: Partial<SearchTermConfig> = {}): SearchTermConfig => ({
  channelId: 'channel-123',
  userId: 'user-123',
  searchTerm: 'test',
  enabled: true,
  excludeKeywords: [],
  includeKeywords: [],
  caseSensitive: false,
  ...overrides,
});

describe('filterDeal', () => {
  describe('search term matching', () => {
    it('passes when search term word is found in title', () => {
      const deal = createDeal({ title: 'Amazing Test Product' });
      const config = createConfig({ searchTerm: 'test' });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });

    it('passes when any search term word is found in title', () => {
      const deal = createDeal({ title: 'NiteCore Power Bank' });
      const config = createConfig({ searchTerm: 'NiteCore NB10000' });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });

    it('passes when search term word is found in merchant', () => {
      const deal = createDeal({ title: 'Power Bank', merchant: 'NiteCore Store' });
      const config = createConfig({ searchTerm: 'NiteCore' });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });

    it('filters out when no search term words found', () => {
      const deal = createDeal({ title: 'Birdsong Wall Clock' });
      const config = createConfig({ searchTerm: 'sonos' });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(false);
      expect(result.filterStatus).toBe('filtered_no_match');
      expect(result.filterReason).toContain('No words from search term');
      expect(result.filterReason).toContain('sonos');
    });

    it('is case insensitive by default', () => {
      const deal = createDeal({ title: 'NITECORE power bank' });
      const config = createConfig({ searchTerm: 'nitecore' });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(true);
    });

    it('respects case sensitive flag', () => {
      const deal = createDeal({ title: 'nitecore power bank' });
      const config = createConfig({ searchTerm: 'NiteCore', caseSensitive: true });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(false);
      expect(result.filterStatus).toBe('filtered_no_match');
    });
  });

  describe('exclude keywords', () => {
    it('filters out when excluded keyword is found', () => {
      const deal = createDeal({ title: 'NiteCore Power Bank Refurbished' });
      const config = createConfig({
        searchTerm: 'NiteCore',
        excludeKeywords: ['refurbished', 'used'],
      });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(false);
      expect(result.filterStatus).toBe('filtered_exclude');
      expect(result.filterReason).toContain('Excluded keyword');
      expect(result.filterReason).toContain('refurbished');
    });

    it('filters out when excluded keyword is found in merchant', () => {
      const deal = createDeal({ title: 'NiteCore Power Bank', merchant: 'eBay Refurbished' });
      const config = createConfig({
        searchTerm: 'NiteCore',
        excludeKeywords: ['refurbished'],
      });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(false);
      expect(result.filterStatus).toBe('filtered_exclude');
    });

    it('passes when no excluded keywords are found', () => {
      const deal = createDeal({ title: 'NiteCore Power Bank New' });
      const config = createConfig({
        searchTerm: 'NiteCore',
        excludeKeywords: ['refurbished', 'used'],
      });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });

    it('respects case sensitivity for exclude keywords', () => {
      const deal = createDeal({ title: 'NiteCore Power Bank REFURBISHED' });
      const config = createConfig({
        searchTerm: 'NiteCore',
        excludeKeywords: ['refurbished'],
        caseSensitive: true,
      });

      const result = filterDeal(deal, config);

      // "refurbished" (lowercase) won't match "REFURBISHED"
      expect(result.passed).toBe(true);
    });
  });

  describe('include keywords', () => {
    it('filters out when required keyword is missing', () => {
      const deal = createDeal({ title: 'NiteCore Power Bank' });
      const config = createConfig({
        searchTerm: 'NiteCore',
        includeKeywords: ['OLED', 'Pro'],
      });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(false);
      expect(result.filterStatus).toBe('filtered_include');
      expect(result.filterReason).toContain('Required keyword(s) not found');
      // Keywords are lowercased for case-insensitive matching
      expect(result.filterReason).toContain('oled');
      expect(result.filterReason).toContain('pro');
    });

    it('passes when all required keywords are found', () => {
      const deal = createDeal({ title: 'NiteCore Power Bank OLED Pro Edition' });
      const config = createConfig({
        searchTerm: 'NiteCore',
        includeKeywords: ['OLED', 'Pro'],
      });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });

    it('filters out when only some required keywords are found', () => {
      const deal = createDeal({ title: 'NiteCore Power Bank OLED' });
      const config = createConfig({
        searchTerm: 'NiteCore',
        includeKeywords: ['OLED', 'Pro'],
      });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(false);
      expect(result.filterStatus).toBe('filtered_include');
      // Keywords are lowercased for case-insensitive matching
      expect(result.filterReason).toContain('pro');
      expect(result.filterReason).not.toContain('oled');
    });

    it('finds required keywords in merchant', () => {
      const deal = createDeal({ title: 'Power Bank', merchant: 'NiteCore Official Store' });
      const config = createConfig({
        searchTerm: 'Power Bank',
        includeKeywords: ['NiteCore'],
      });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });
  });

  describe('filter priority', () => {
    it('checks search term match before exclude keywords', () => {
      // If search term doesn't match, we get filtered_no_match even if excluded keywords are present
      const deal = createDeal({ title: 'Random Refurbished Product' });
      const config = createConfig({
        searchTerm: 'NiteCore',
        excludeKeywords: ['refurbished'],
      });

      const result = filterDeal(deal, config);

      // Should be filtered_no_match, not filtered_exclude
      expect(result.filterStatus).toBe('filtered_no_match');
    });

    it('checks exclude keywords before include keywords', () => {
      // If excluded keyword is found, we get filtered_exclude even if include keywords are present
      const deal = createDeal({ title: 'NiteCore OLED Refurbished' });
      const config = createConfig({
        searchTerm: 'NiteCore',
        excludeKeywords: ['refurbished'],
        includeKeywords: ['OLED'],
      });

      const result = filterDeal(deal, config);

      expect(result.filterStatus).toBe('filtered_exclude');
    });
  });

  describe('match details', () => {
    it('always returns match details', () => {
      const deal = createDeal({ title: 'NiteCore Power Bank' });
      const config = createConfig({ searchTerm: 'NiteCore' });

      const result = filterDeal(deal, config);

      expect(result.matchDetails).toBeDefined();
      expect(result.matchDetails.searchText).toContain('NiteCore');
    });

    it('returns match details even when filtered', () => {
      const deal = createDeal({ title: 'Random Product' });
      const config = createConfig({ searchTerm: 'NiteCore' });

      const result = filterDeal(deal, config);

      expect(result.matchDetails).toBeDefined();
      // Match details preserve original case
      expect(result.matchDetails.searchText).toBe('Random Product');
    });

    it('includes matched segments for matching terms', () => {
      const deal = createDeal({ title: 'Amazing NiteCore NB10000 Power Bank' });
      const config = createConfig({ searchTerm: 'NiteCore NB10000' });

      const result = filterDeal(deal, config);

      expect(result.matchDetails.matchedSegments.length).toBeGreaterThan(0);
    });
  });
});
