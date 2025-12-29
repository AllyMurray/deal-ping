import { Entity } from 'electrodb';
import { randomUUID } from 'crypto';

/**
 * BookmarkedDeal entity stores deals that users have saved for later reference.
 *
 * Users can bookmark interesting deals from the deal history page and view them
 * in a dedicated bookmarks page. Bookmarks are per-user and include the essential
 * deal information so they remain viewable even if the original deal record expires.
 */
export const BookmarkedDealEntity = new Entity({
  model: {
    entity: 'BookmarkedDeal',
    version: '1',
    service: 'hotukdeals',
  },
  attributes: {
    bookmarkId: {
      type: 'string',
      required: true,
      default: () => randomUUID(),
    },
    userId: {
      type: 'string',
      required: true,
    },
    dealId: {
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
    searchTerm: {
      type: 'string',
      required: true,
    },
    bookmarkedAt: {
      type: 'number',
      default: () => Date.now(),
    },
    createdAt: {
      type: 'string',
      default: () => new Date().toISOString(),
      readOnly: true,
    },
  },
  indexes: {
    // Primary access: Get bookmark by ID
    byBookmarkId: {
      pk: {
        field: 'pk',
        composite: ['bookmarkId'],
        template: 'BOOKMARK#${bookmarkId}',
      },
      sk: {
        field: 'sk',
        composite: ['bookmarkId'],
        template: 'BOOKMARK#${bookmarkId}',
      },
    },
    // GSI1: Get all bookmarks for a user (sorted by bookmark time, newest first)
    byUser: {
      index: 'gsi1',
      pk: {
        field: 'gsi1pk',
        composite: ['userId'],
        template: 'USER#${userId}#BOOKMARKS',
      },
      sk: {
        field: 'gsi1sk',
        composite: ['bookmarkedAt'],
        template: 'TS#${bookmarkedAt}',
      },
    },
    // GSI2: Check if a specific deal is bookmarked by a user
    byUserDeal: {
      index: 'gsi2',
      pk: {
        field: 'gsi2pk',
        composite: ['userId'],
        template: 'USER#${userId}#BOOKMARK_CHECK',
      },
      sk: {
        field: 'gsi2sk',
        composite: ['dealId'],
        template: 'DEAL#${dealId}',
      },
    },
  },
});
