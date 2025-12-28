import { Entity } from 'electrodb';
import { randomUUID } from 'crypto';

// Type is defined via Zod schema in ../schemas.ts
export const ChannelEntity = new Entity({
  model: {
    entity: 'Channel',
    version: '2',
    service: 'hotukdeals',
  },
  attributes: {
    channelId: {
      type: 'string',
      required: true,
      default: () => randomUUID(),
    },
    userId: {
      type: 'string',
      required: true,
    },
    name: {
      type: 'string',
      required: true,
    },
    webhookUrl: {
      type: 'string',
      required: true,
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
    // Primary access: Get channel by ID
    byChannelId: {
      pk: {
        field: 'pk',
        composite: ['channelId'],
        template: 'channel#${channelId}',
      },
      sk: {
        field: 'sk',
        composite: ['channelId'],
        template: 'channel#${channelId}',
      },
    },
    // GSI1: List channels by user (web app)
    byUser: {
      index: 'gsi1',
      pk: {
        field: 'gsi1pk',
        composite: ['userId'],
        template: 'user#${userId}#channels',
      },
      sk: {
        field: 'gsi1sk',
        composite: ['channelId'],
        template: 'channel#${channelId}',
      },
    },
    // GSI3: List all channels (notifier)
    allChannels: {
      index: 'gsi3',
      pk: {
        field: 'gsi3pk',
        composite: [],
        template: 'all#channels',
      },
      sk: {
        field: 'gsi3sk',
        composite: ['channelId'],
        template: 'channel#${channelId}',
      },
    },
  },
});
