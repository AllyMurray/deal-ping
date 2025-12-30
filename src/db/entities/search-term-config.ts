import { Entity } from 'electrodb';

// Type is defined via Zod schema in ../schemas.ts
export const SearchTermConfigEntity = new Entity({
  model: {
    entity: 'SearchTermConfig',
    version: '2',
    service: 'hotukdeals',
  },
  attributes: {
    channelId: {
      type: 'string',
      required: true,
    },
    userId: {
      type: 'string',
      required: true,
    },
    searchTerm: {
      type: 'string',
      required: true,
    },
    enabled: {
      type: 'boolean',
      default: true,
    },
    excludeKeywords: {
      type: 'list',
      items: {
        type: 'string',
      },
      default: [],
    },
    includeKeywords: {
      type: 'list',
      items: {
        type: 'string',
      },
      default: [],
    },
    caseSensitive: {
      type: 'boolean',
      default: false,
    },
    fuzzyMatch: {
      type: 'boolean',
      default: false,
    },
    maxPrice: {
      type: 'number', // Maximum price threshold in pence (e.g., 5000 = £50.00)
    },
    minDiscount: {
      type: 'number', // Minimum discount percentage (e.g., 30 = 30% off)
    },
    createdAt: {
      type: 'string',
      default: () => new Date().toISOString(),
      readOnly: true,
    },
    updatedAt: {
      type: 'string',
      watch: '*',
      set: () => new Date().toISOString(),
    },
  },
  indexes: {
    // Primary access pattern: Get all configs for a channel
    byChannel: {
      pk: {
        field: 'pk',
        composite: ['channelId'],
        template: 'channel#${channelId}',
      },
      sk: {
        field: 'sk',
        composite: ['searchTerm'],
        template: 'config#${searchTerm}',
      },
    },
    // GSI1: List configs by user (web app)
    byUser: {
      index: 'gsi1',
      pk: {
        field: 'gsi1pk',
        composite: ['userId'],
        template: 'user#${userId}#configs',
      },
      sk: {
        field: 'gsi1sk',
        composite: ['channelId', 'searchTerm'],
        template: '${channelId}#${searchTerm}',
      },
    },
    // GSI2: Lookup by search term (notifier)
    bySearchTerm: {
      index: 'gsi2',
      pk: {
        field: 'gsi2pk',
        composite: ['searchTerm'],
        template: 'searchterm#${searchTerm}',
      },
      sk: {
        field: 'gsi2sk',
        composite: ['channelId'],
        template: 'channel#${channelId}',
      },
    },
    // GSI3: List all configs (notifier)
    allConfigs: {
      index: 'gsi3',
      pk: {
        field: 'gsi3pk',
        composite: [],
        template: 'all#configs',
      },
      sk: {
        field: 'gsi3sk',
        composite: ['channelId', 'searchTerm'],
        template: '${channelId}#${searchTerm}',
      },
    },
  },
});
