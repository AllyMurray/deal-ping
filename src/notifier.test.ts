import { describe, it, expect } from 'vitest';
import { filterDeal, FilterResult, FilterStatus, parsePriceToPence } from './notifier';
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

describe('parsePriceToPence', () => {
  it('parses price with pound symbol', () => {
    expect(parsePriceToPence('£50.00')).toBe(5000);
  });

  it('parses price without decimal', () => {
    expect(parsePriceToPence('£50')).toBe(5000);
  });

  it('parses price without currency symbol', () => {
    expect(parsePriceToPence('50.00')).toBe(5000);
  });

  it('parses price with comma separator', () => {
    expect(parsePriceToPence('£1,234.56')).toBe(123456);
  });

  it('parses price with dollar symbol', () => {
    expect(parsePriceToPence('$99.99')).toBe(9999);
  });

  it('parses price with euro symbol', () => {
    expect(parsePriceToPence('€25.50')).toBe(2550);
  });

  it('handles whitespace', () => {
    expect(parsePriceToPence(' £ 50.00 ')).toBe(5000);
  });

  it('returns null for undefined', () => {
    expect(parsePriceToPence(undefined)).toBe(null);
  });

  it('returns null for empty string', () => {
    expect(parsePriceToPence('')).toBe(null);
  });

  it('returns null for non-numeric string', () => {
    expect(parsePriceToPence('free')).toBe(null);
  });

  it('rounds to nearest pence', () => {
    expect(parsePriceToPence('£10.999')).toBe(1100);
  });
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

    it('passes when entire search term is found in title', () => {
      const deal = createDeal({ title: 'NiteCore NB10000 Power Bank' });
      const config = createConfig({ searchTerm: 'NiteCore NB10000' });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });

    it('filters out when only partial search term is found', () => {
      const deal = createDeal({ title: 'NiteCore Power Bank' });
      const config = createConfig({ searchTerm: 'NiteCore NB10000' });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(false);
      expect(result.filterStatus).toBe('filtered_no_match');
    });

    it('passes when search term word is found in merchant', () => {
      const deal = createDeal({ title: 'Power Bank', merchant: 'NiteCore Store' });
      const config = createConfig({ searchTerm: 'NiteCore' });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });

    it('filters out when search term not found', () => {
      const deal = createDeal({ title: 'Birdsong Wall Clock' });
      const config = createConfig({ searchTerm: 'sonos' });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(false);
      expect(result.filterStatus).toBe('filtered_no_match');
      expect(result.filterReason).toContain('Search term');
      expect(result.filterReason).toContain('sonos');
      expect(result.filterReason).toContain('not found');
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

  describe('fuzzy matching', () => {
    it('matches any word from search term when fuzzyMatch is enabled', () => {
      const deal = createDeal({ title: 'NiteCore Power Bank' });
      const config = createConfig({ searchTerm: 'NiteCore NB10000', fuzzyMatch: true });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });

    it('requires entire search term when fuzzyMatch is disabled (default)', () => {
      const deal = createDeal({ title: 'NiteCore Power Bank' });
      const config = createConfig({ searchTerm: 'NiteCore NB10000', fuzzyMatch: false });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(false);
      expect(result.filterStatus).toBe('filtered_no_match');
    });

    it('defaults to exact phrase matching when fuzzyMatch is not specified', () => {
      const deal = createDeal({ title: 'NiteCore Power Bank' });
      const config = createConfig({ searchTerm: 'NiteCore NB10000' });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(false);
      expect(result.filterStatus).toBe('filtered_no_match');
    });

    it('passes with fuzzyMatch when any word matches in merchant', () => {
      const deal = createDeal({ title: 'Power Bank', merchant: 'NiteCore Store' });
      const config = createConfig({ searchTerm: 'NiteCore NB10000', fuzzyMatch: true });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(true);
    });

    it('shows appropriate filter reason for fuzzy match failure', () => {
      const deal = createDeal({ title: 'Random Product' });
      const config = createConfig({ searchTerm: 'NiteCore NB10000', fuzzyMatch: true });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(false);
      expect(result.filterReason).toContain('No words from search term');
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

  describe('price threshold (maxPrice)', () => {
    it('passes when price is under maxPrice threshold', () => {
      const deal = createDeal({ title: 'Test Product', price: '£45.00' });
      const config = createConfig({
        searchTerm: 'Test',
        maxPrice: 5000, // £50.00 in pence
      });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });

    it('passes when price equals maxPrice threshold', () => {
      const deal = createDeal({ title: 'Test Product', price: '£50.00' });
      const config = createConfig({
        searchTerm: 'Test',
        maxPrice: 5000, // £50.00 in pence
      });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });

    it('filters out when price exceeds maxPrice threshold', () => {
      const deal = createDeal({ title: 'Test Product', price: '£75.00' });
      const config = createConfig({
        searchTerm: 'Test',
        maxPrice: 5000, // £50.00 in pence
      });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(false);
      expect(result.filterStatus).toBe('filtered_price_too_high');
      expect(result.filterReason).toContain('£75.00');
      expect(result.filterReason).toContain('£50.00');
    });

    it('passes when deal has no price and maxPrice is set', () => {
      const deal = createDeal({ title: 'Test Product', price: undefined });
      const config = createConfig({
        searchTerm: 'Test',
        maxPrice: 5000,
      });

      const result = filterDeal(deal, config);

      // No price means we can't compare, so we pass
      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });

    it('passes when deal has unparseable price and maxPrice is set', () => {
      const deal = createDeal({ title: 'Test Product', price: 'Free' });
      const config = createConfig({
        searchTerm: 'Test',
        maxPrice: 5000,
      });

      const result = filterDeal(deal, config);

      // Unparseable price means we can't compare, so we pass
      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });

    it('ignores maxPrice when not set', () => {
      const deal = createDeal({ title: 'Test Product', price: '£1000.00' });
      const config = createConfig({
        searchTerm: 'Test',
        maxPrice: undefined,
      });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });
  });

  describe('discount threshold (minDiscount)', () => {
    it('passes when discount meets minDiscount threshold', () => {
      const deal = createDeal({ title: 'Test Product', savingsPercentage: 40 });
      const config = createConfig({
        searchTerm: 'Test',
        minDiscount: 30, // 30%
      });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });

    it('passes when discount equals minDiscount threshold', () => {
      const deal = createDeal({ title: 'Test Product', savingsPercentage: 30 });
      const config = createConfig({
        searchTerm: 'Test',
        minDiscount: 30,
      });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });

    it('filters out when discount is below minDiscount threshold', () => {
      const deal = createDeal({ title: 'Test Product', savingsPercentage: 15 });
      const config = createConfig({
        searchTerm: 'Test',
        minDiscount: 30,
      });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(false);
      expect(result.filterStatus).toBe('filtered_discount_too_low');
      expect(result.filterReason).toContain('15%');
      expect(result.filterReason).toContain('30%');
    });

    it('filters out when deal has no discount and minDiscount is set', () => {
      const deal = createDeal({ title: 'Test Product', savingsPercentage: undefined });
      const config = createConfig({
        searchTerm: 'Test',
        minDiscount: 30,
      });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(false);
      expect(result.filterStatus).toBe('filtered_discount_too_low');
      expect(result.filterReason).toContain('No discount information');
    });

    it('ignores minDiscount when not set', () => {
      const deal = createDeal({ title: 'Test Product', savingsPercentage: 5 });
      const config = createConfig({
        searchTerm: 'Test',
        minDiscount: undefined,
      });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });
  });

  describe('combined filters with price thresholds', () => {
    it('checks exclude keywords before price thresholds', () => {
      const deal = createDeal({ title: 'Test Refurbished Product', price: '£25.00' });
      const config = createConfig({
        searchTerm: 'Test',
        excludeKeywords: ['refurbished'],
        maxPrice: 5000,
      });

      const result = filterDeal(deal, config);

      // Should be filtered by exclude keyword, not price
      expect(result.filterStatus).toBe('filtered_exclude');
    });

    it('checks include keywords before price thresholds', () => {
      const deal = createDeal({ title: 'Test Product', price: '£25.00' });
      const config = createConfig({
        searchTerm: 'Test',
        includeKeywords: ['OLED'],
        maxPrice: 5000,
      });

      const result = filterDeal(deal, config);

      // Should be filtered by missing include keyword, not price
      expect(result.filterStatus).toBe('filtered_include');
    });

    it('checks maxPrice before minDiscount', () => {
      const deal = createDeal({ title: 'Test Product', price: '£100.00', savingsPercentage: 10 });
      const config = createConfig({
        searchTerm: 'Test',
        maxPrice: 5000, // £50.00
        minDiscount: 30,
      });

      const result = filterDeal(deal, config);

      // Should be filtered by price, not discount
      expect(result.filterStatus).toBe('filtered_price_too_high');
    });

    it('passes when all thresholds are met', () => {
      const deal = createDeal({ title: 'Test Product', price: '£25.00', savingsPercentage: 40 });
      const config = createConfig({
        searchTerm: 'Test',
        maxPrice: 5000,
        minDiscount: 30,
      });

      const result = filterDeal(deal, config);

      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });
  });
});
