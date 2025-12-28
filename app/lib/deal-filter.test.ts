import { describe, it, expect } from 'vitest';
import { applyFilter, type FilterConfig, type Deal } from './deal-filter';

describe('deal-filter', () => {
  // Note: Search terms are matched as-is (split by whitespace)
  // "steam deck" (with space) matches "Steam Deck" in title
  // "steam-deck" (with hyphen) would need "steam-deck" in title to match
  const baseDeal: Deal = {
    id: 'deal-1',
    title: 'Steam Deck OLED 512GB Gaming Console',
    merchant: 'Amazon',
    searchTerm: 'steam deck',
  };

  const baseConfig: FilterConfig = {
    searchTerm: 'steam deck',
    includeKeywords: [],
    excludeKeywords: [],
    caseSensitive: false,
  };

  describe('applyFilter', () => {
    it('should pass when deal matches search term', () => {
      const result = applyFilter(baseDeal, baseConfig);
      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });

    it('should filter when no search term words match', () => {
      const deal = { ...baseDeal, title: 'PlayStation 5 Console' };
      const result = applyFilter(deal, baseConfig);
      expect(result.passed).toBe(false);
      expect(result.filterStatus).toBe('filtered_no_match');
      expect(result.filterReason).toContain('No words from search term');
    });

    it('should filter when excluded keyword is found', () => {
      const config = { ...baseConfig, excludeKeywords: ['OLED'] };
      const result = applyFilter(baseDeal, config);
      expect(result.passed).toBe(false);
      expect(result.filterStatus).toBe('filtered_exclude');
      expect(result.filterReason).toContain('Excluded keyword');
    });

    it('should pass when excluded keyword is not found', () => {
      const config = { ...baseConfig, excludeKeywords: ['refurbished'] };
      const result = applyFilter(baseDeal, config);
      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });

    it('should filter when required keyword is missing', () => {
      const config = { ...baseConfig, includeKeywords: ['512GB', 'OLED', 'LCD'] };
      const result = applyFilter(baseDeal, config);
      expect(result.passed).toBe(false);
      expect(result.filterStatus).toBe('filtered_include');
      expect(result.filterReason).toContain('lcd'); // lowercase because case-insensitive
    });

    it('should pass when all required keywords are found', () => {
      const config = { ...baseConfig, includeKeywords: ['512GB', 'OLED'] };
      const result = applyFilter(baseDeal, config);
      expect(result.passed).toBe(true);
      expect(result.filterStatus).toBe('passed');
    });

    it('should be case-insensitive by default', () => {
      const config = { ...baseConfig, excludeKeywords: ['oled'] }; // lowercase
      const result = applyFilter(baseDeal, config);
      expect(result.passed).toBe(false);
      expect(result.filterStatus).toBe('filtered_exclude');
    });

    it('should respect case sensitivity when enabled', () => {
      // When case-sensitive is enabled, search term must also match case
      const config = {
        ...baseConfig,
        searchTerm: 'Steam Deck', // Must match case in title
        excludeKeywords: ['oled'], // lowercase 'oled' won't match 'OLED'
        caseSensitive: true,
      };
      const result = applyFilter(baseDeal, config);
      expect(result.passed).toBe(true); // 'oled' lowercase doesn't match 'OLED'
    });

    it('should check merchant field for matches', () => {
      const deal = { ...baseDeal, title: 'Gaming Console 512GB', merchant: 'Steam Deck Official Store' };
      const result = applyFilter(deal, baseConfig);
      expect(result.passed).toBe(true);
    });

    it('should apply exclude keywords to merchant', () => {
      const config = { ...baseConfig, excludeKeywords: ['amazon'] };
      const result = applyFilter(baseDeal, config);
      expect(result.passed).toBe(false);
      expect(result.filterStatus).toBe('filtered_exclude');
    });
  });
});
