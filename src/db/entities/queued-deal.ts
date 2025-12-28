import { Entity } from 'electrodb';
import { randomUUID } from 'crypto';

/**
 * QueuedDeal entity stores deals that matched during quiet hours.
 *
 * When a channel has quiet hours enabled and the current time is within
 * the quiet period, deals are queued here instead of being sent immediately.
 * When quiet hours end, all queued deals for that channel are sent in a batch.
 *
 * The entity uses a 24-hour TTL to ensure stale queued deals are cleaned up
 * in case of processing failures.
 */
const TWENTY_FOUR_HOURS_IN_SECONDS = 24 * 60 * 60;

export const QueuedDealEntity = new Entity({
  model: {
    entity: 'QueuedDeal',
    version: '1',
    service: 'hotukdeals',
  },
  attributes: {
    queuedDealId: {
      type: 'string',
      required: true,
      default: () => randomUUID(),
    },
    channelId: {
      type: 'string',
      required: true,
    },
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
    queuedAt: {
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
      default: () => Math.floor(Date.now() / 1000) + TWENTY_FOUR_HOURS_IN_SECONDS,
      readOnly: true,
    },
  },
  indexes: {
    // Primary access: Get queued deal by ID
    byQueuedDealId: {
      pk: {
        field: 'pk',
        composite: ['queuedDealId'],
        template: 'QUEUED_DEAL#${queuedDealId}',
      },
      sk: {
        field: 'sk',
        composite: ['queuedDealId'],
        template: 'QUEUED_DEAL#${queuedDealId}',
      },
    },
    // GSI1: Get all queued deals for a channel (sorted by queue time)
    byChannel: {
      index: 'gsi1',
      pk: {
        field: 'gsi1pk',
        composite: ['channelId'],
        template: 'QUEUED#${channelId}',
      },
      sk: {
        field: 'gsi1sk',
        composite: ['queuedAt'],
        template: 'TS#${queuedAt}',
      },
    },
    // GSI3: Get all queued deals globally (for batch processing)
    allQueued: {
      index: 'gsi3',
      pk: {
        field: 'gsi3pk',
        composite: [],
        template: 'all#queued',
      },
      sk: {
        field: 'gsi3sk',
        composite: ['channelId', 'queuedAt'],
        template: '${channelId}#${queuedAt}',
      },
    },
  },
});
