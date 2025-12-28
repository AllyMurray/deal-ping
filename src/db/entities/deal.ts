import { Entity } from 'electrodb';

/**
 * Deal entity tracks processed deals to prevent duplicate notifications.
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
  },
});
