import { Entity } from 'electrodb';

// AllowedUser entity for managing who can access the app
export const AllowedUserEntity = new Entity({
  model: {
    entity: 'AllowedUser',
    version: '1',
    service: 'hotukdeals',
  },
  attributes: {
    discordId: {
      type: 'string',
      required: true,
    },
    username: {
      type: 'string',
      required: false,
    },
    avatar: {
      type: 'string',
      required: false,
    },
    isAdmin: {
      type: 'boolean',
      required: true,
      default: false,
    },
    addedBy: {
      type: 'string',
      required: true,
    },
    addedAt: {
      type: 'string',
      default: () => new Date().toISOString(),
      readOnly: true,
    },
    // Quiet hours settings (account-level)
    quietHoursEnabled: {
      type: 'boolean',
      default: false,
    },
    quietHoursStart: {
      type: 'string', // HH:mm format (e.g., "22:00")
    },
    quietHoursEnd: {
      type: 'string', // HH:mm format (e.g., "08:00")
    },
    quietHoursTimezone: {
      type: 'string', // IANA timezone (e.g., "Europe/London")
    },
  },
  indexes: {
    // Primary access: Get user by Discord ID
    byDiscordId: {
      pk: {
        field: 'pk',
        composite: ['discordId'],
        template: 'alloweduser#${discordId}',
      },
      sk: {
        field: 'sk',
        composite: ['discordId'],
        template: 'alloweduser#${discordId}',
      },
    },
    // GSI3: List all allowed users (admin)
    allUsers: {
      index: 'gsi3',
      pk: {
        field: 'gsi3pk',
        composite: [],
        template: 'all#allowedusers',
      },
      sk: {
        field: 'gsi3sk',
        composite: ['discordId'],
        template: 'user#${discordId}',
      },
    },
  },
});
