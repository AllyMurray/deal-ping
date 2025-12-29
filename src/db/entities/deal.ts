import { Entity } from 'electrodb';

/**
 * Deal entity tracks all deals returned by HotUKDeals searches.
 *
 * Stores both passed and filtered deals so users can see how their
 * filters affect results. filterStatus indicates whether the deal
 * passed filtering and was sent as a notification.
 *
 * TTL is set to 12 months - long enough to prevent duplicate notifications
 * (deals rarely stay in search results that long) while providing data hygiene.
 *
 * Type is defined via Zod schema in ../schemas.ts
 */
const TWELVE_MONTHS_IN_SECONDS = 365 * 24 * 60 * 60;
export const DealEntity = new Entity({
  model: {
    entity: 'Deal',
    version: '1',
    service: 'hotukdeals',
  },
  attributes: {
    dealId: {
      type: 'string',
      required: true,
    },
    searchTerm: {
      type: 'string',
      required: true,
    },
    title: {
      type: 'string',
      required: true,
    },
    link: {
      type: 'string',
      required: true,
    },
    price: {
      type: 'string',
    },
    merchant: {
      type: 'string',
    },
    matchDetails: {
      type: 'string', // Serialized JSON of MatchDetails
    },
    filterStatus: {
      type: ['passed', 'filtered_no_match', 'filtered_exclude', 'filtered_include', 'filtered_price_too_high', 'filtered_discount_too_low'] as const,
      required: true,
      default: 'passed',
    },
    filterReason: {
      type: 'string', // Human-readable reason for filtering
    },
    notified: {
      type: 'boolean',
      default: false, // Whether a notification was sent for this deal
    },
    timestamp: {
      type: 'number',
      default: () => Date.now(),
    },
    createdAt: {
      type: 'string',
      default: () => new Date().toISOString(),
      readOnly: true,
    },
    ttl: {
      type: 'number',
      default: () => Math.floor(Date.now() / 1000) + TWELVE_MONTHS_IN_SECONDS,
      readOnly: true,
    },
  },
  indexes: {
    // Primary access pattern: Check if deal exists by ID
    byDealId: {
      pk: {
        field: 'pk',
        composite: ['dealId'],
        template: 'DEAL#${dealId}',
      },
      sk: {
        field: 'sk',
        composite: ['dealId'],
        template: 'DEAL#${dealId}',
      },
    },
    // Query deals by search term (for channel page display)
    bySearchTerm: {
      index: 'gsi1',
      pk: {
        field: 'gsi1pk',
        composite: ['searchTerm'],
        template: 'DEALS#${searchTerm}',
      },
      sk: {
        field: 'gsi1sk',
        composite: ['timestamp'],
        template: 'TS#${timestamp}',
      },
    },
  },
});
