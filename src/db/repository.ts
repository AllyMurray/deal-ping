import { HotUKDealsService } from './service';
import type { Channel, SearchTermConfig, Deal, AllowedUser } from './schemas';
import {
  parseChannel,
  parseChannels,
  parseSearchTermConfig,
  parseSearchTermConfigs,
  parseDeal,
  parseAllowedUser,
  parseAllowedUsers,
} from './schemas';

// ============================================================================
// Parameter Types
// ============================================================================

// Channel params
export type GetChannelsByUserParams = { userId: string };
export type GetChannelParams = { id: string };
export type UpdateChannelParams = { id: string; name?: string; webhookUrl?: string };
export type DeleteChannelParams = { id: string };
export type CreateChannelParams = { userId: string; name: string; webhookUrl: string };

// Config params
export type GetConfigsByUserParams = { userId: string };
export type GetConfigsByChannelParams = { channelId: string };
export type GetConfigParams = { channelId: string; searchTerm: string };
export type GetConfigBySearchTermParams = { term: string };
export type UpsertConfigParams = {
  userId: string;
  channelId: string;
  searchTerm: string;
  enabled?: boolean;
  excludeKeywords?: string[];
  includeKeywords?: string[];
  caseSensitive?: boolean;
};
export type DeleteConfigParams = { channelId: string; searchTerm: string };
export type DeleteConfigsByChannelParams = { channelId: string };

// Deal params
export type DealExistsParams = { id: string };
export type GetDealParams = { id: string };
export type CreateDealParams = {
  id: string;
  searchTerm: string;
  title: string;
  link: string;
  price?: string;
  merchant?: string;
  matchDetails?: string; // Serialized JSON of MatchDetails
};

// AllowedUser params
export type IsUserAllowedParams = { discordId: string };
export type IsUserAdminParams = { discordId: string };
export type GetAllowedUserParams = { discordId: string };
export type AddAllowedUserParams = {
  discordId: string;
  addedBy: string;
  isAdmin?: boolean;
};
export type RemoveAllowedUserParams = { discordId: string };

// ============================================================================
// Channel Repository
// ============================================================================

/**
 * Get all channels for a user (using GSI1 - user-scoped)
 */
export async function getChannelsByUser({ userId }: GetChannelsByUserParams): Promise<Channel[]> {
  const result = await HotUKDealsService.entities.channel.query
    .byUser({ userId })
    .go();
  return parseChannels(result.data);
}

/**
 * Get all channels (using GSI3 - for notifier)
 */
export async function getAllChannels(): Promise<Channel[]> {
  const result = await HotUKDealsService.entities.channel.query
    .allChannels({})
    .go();
  return parseChannels(result.data);
}

/**
 * Get a channel by ID
 */
export async function getChannel({ id }: GetChannelParams): Promise<Channel | null> {
  const result = await HotUKDealsService.entities.channel.query
    .byChannelId({ channelId: id })
    .go();
  const data = result.data[0];
  return data ? parseChannel(data) : null;
}

/**
 * Create a new channel
 */
export async function createChannel({ userId, name, webhookUrl }: CreateChannelParams): Promise<Channel> {
  const result = await HotUKDealsService.entities.channel
    .put({ userId, name, webhookUrl })
    .go();
  return parseChannel(result.data);
}

/**
 * Update a channel
 */
export async function updateChannel({ id, name, webhookUrl }: UpdateChannelParams): Promise<Channel> {
  const updates: { name?: string; webhookUrl?: string } = {};
  if (name !== undefined) updates.name = name;
  if (webhookUrl !== undefined) updates.webhookUrl = webhookUrl;

  const result = await HotUKDealsService.entities.channel
    .patch({ channelId: id })
    .set(updates)
    .go();
  return parseChannel(result.data);
}

/**
 * Delete a channel and all its configs
 */
export async function deleteChannel({ id }: DeleteChannelParams): Promise<void> {
  // First delete all configs for this channel
  await deleteConfigsByChannel({ channelId: id });

  // Then delete the channel
  await HotUKDealsService.entities.channel
    .delete({ channelId: id })
    .go();
}

// ============================================================================
// SearchTermConfig Repository
// ============================================================================

/**
 * Get all configs for a user (using GSI1 - user-scoped)
 */
export async function getConfigsByUser({ userId }: GetConfigsByUserParams): Promise<SearchTermConfig[]> {
  const result = await HotUKDealsService.entities.searchTermConfig.query
    .byUser({ userId })
    .go();
  return parseSearchTermConfigs(result.data);
}

/**
 * Get all search term configs (using GSI3 - for notifier)
 */
export async function getAllConfigs(): Promise<SearchTermConfig[]> {
  const result = await HotUKDealsService.entities.searchTermConfig.query
    .allConfigs({})
    .go();
  return parseSearchTermConfigs(result.data);
}

/**
 * Get all enabled search term configs
 */
export async function getEnabledConfigs(): Promise<SearchTermConfig[]> {
  const configs = await getAllConfigs();
  return configs.filter((config) => config.enabled);
}

/**
 * Get all configs for a specific channel (no scan - uses primary key)
 */
export async function getConfigsByChannel({ channelId }: GetConfigsByChannelParams): Promise<SearchTermConfig[]> {
  const result = await HotUKDealsService.entities.searchTermConfig.query
    .byChannel({ channelId })
    .go();
  return parseSearchTermConfigs(result.data);
}

/**
 * Get a specific config by channel ID and search term
 */
export async function getConfig({ channelId, searchTerm }: GetConfigParams): Promise<SearchTermConfig | null> {
  const result = await HotUKDealsService.entities.searchTermConfig.query
    .byChannel({ channelId, searchTerm })
    .go();
  const data = result.data[0];
  return data ? parseSearchTermConfig(data) : null;
}

/**
 * Get a config by search term (uses GSI)
 */
export async function getConfigBySearchTerm({ term }: GetConfigBySearchTermParams): Promise<SearchTermConfig | null> {
  const result = await HotUKDealsService.entities.searchTermConfig.query
    .bySearchTerm({ searchTerm: term })
    .go();
  const data = result.data[0];
  return data ? parseSearchTermConfig(data) : null;
}

/**
 * Get all configs for a search term (multiple channels could use same term)
 */
export async function getAllConfigsForSearchTerm({ term }: GetConfigBySearchTermParams): Promise<SearchTermConfig[]> {
  const result = await HotUKDealsService.entities.searchTermConfig.query
    .bySearchTerm({ searchTerm: term })
    .go();
  return parseSearchTermConfigs(result.data);
}

/**
 * Create or update a search term config
 */
export async function upsertConfig(config: UpsertConfigParams): Promise<SearchTermConfig> {
  const { channelId, searchTerm, userId } = config;

  // Check if config already exists
  const existing = await getConfig({ channelId, searchTerm });

  if (existing) {
    // Update existing config - use patch to respect readOnly fields
    await HotUKDealsService.entities.searchTermConfig
      .patch({ channelId, searchTerm })
      .set({
        enabled: config.enabled ?? existing.enabled,
        excludeKeywords: config.excludeKeywords ?? existing.excludeKeywords,
        includeKeywords: config.includeKeywords ?? existing.includeKeywords,
        caseSensitive: config.caseSensitive ?? existing.caseSensitive,
      })
      .go();
  } else {
    // Create new config
    await HotUKDealsService.entities.searchTermConfig
      .put({
        userId,
        channelId,
        searchTerm,
        enabled: config.enabled ?? true,
        excludeKeywords: config.excludeKeywords ?? [],
        includeKeywords: config.includeKeywords ?? [],
        caseSensitive: config.caseSensitive ?? false,
      })
      .go();
  }

  // Fetch and return the updated config
  const updated = await getConfig({ channelId, searchTerm });
  if (!updated) {
    throw new Error('Failed to upsert config');
  }
  return updated;
}

/**
 * Delete a config by channel ID and search term
 */
export async function deleteConfig({ channelId, searchTerm }: DeleteConfigParams): Promise<void> {
  await HotUKDealsService.entities.searchTermConfig
    .delete({ channelId, searchTerm })
    .go();
}

/**
 * Delete all configs for a channel
 */
export async function deleteConfigsByChannel({ channelId }: DeleteConfigsByChannelParams): Promise<string[]> {
  const configs = await getConfigsByChannel({ channelId });
  const searchTerms = configs.map((c) => c.searchTerm);

  await Promise.all(
    configs.map((config) =>
      HotUKDealsService.entities.searchTermConfig
        .delete({ channelId, searchTerm: config.searchTerm })
        .go()
    )
  );

  return searchTerms;
}

// ============================================================================
// Deal Repository
// ============================================================================

/**
 * Check if a deal exists by ID
 */
export async function dealExists({ id }: DealExistsParams): Promise<boolean> {
  const result = await HotUKDealsService.entities.deal.query
    .byDealId({ dealId: id })
    .go();
  return result.data.length > 0;
}

/**
 * Get a deal by ID
 */
export async function getDeal({ id }: GetDealParams): Promise<Deal | null> {
  const result = await HotUKDealsService.entities.deal.query
    .byDealId({ dealId: id })
    .go();
  const data = result.data[0];
  return data ? parseDeal(data) : null;
}

/**
 * Create a new deal record
 */
export async function createDeal(deal: CreateDealParams): Promise<Deal> {
  const result = await HotUKDealsService.entities.deal
    .put({
      dealId: deal.id,
      searchTerm: deal.searchTerm,
      title: deal.title,
      link: deal.link,
      price: deal.price,
      merchant: deal.merchant,
      matchDetails: deal.matchDetails,
      timestamp: Date.now(),
    })
    .go();
  return parseDeal(result.data);
}

// ============================================================================
// Grouped Config Helpers (for notifier)
// ============================================================================

export interface ChannelWithConfigs {
  channel: Channel;
  configs: SearchTermConfig[];
}

/**
 * Get all enabled configs grouped by channel (with channel details)
 */
export async function getEnabledConfigsGroupedByChannel(): Promise<ChannelWithConfigs[]> {
  // Get all enabled configs and all channels in parallel
  const [configs, channels] = await Promise.all([
    getEnabledConfigs(),
    getAllChannels(),
  ]);

  // Create a map of channelId -> Channel for quick lookup
  const channelMap = new Map(channels.map((c) => [c.channelId, c]));

  // Group configs by channelId
  const grouped = configs.reduce(
    (acc, config) => {
      if (!acc[config.channelId]) {
        acc[config.channelId] = [];
      }
      acc[config.channelId].push(config);
      return acc;
    },
    {} as Record<string, SearchTermConfig[]>
  );

  // Build result with channel details
  return Object.entries(grouped)
    .map(([channelId, configs]) => {
      const channel = channelMap.get(channelId);
      if (!channel) {
        // Skip configs for channels that no longer exist
        return null;
      }
      return { channel, configs };
    })
    .filter((item): item is ChannelWithConfigs => item !== null);
}

// ============================================================================
// AllowedUser Repository
// ============================================================================

/**
 * Check if a Discord user is allowed to access the app
 */
export async function isUserAllowed({ discordId }: IsUserAllowedParams): Promise<boolean> {
  const result = await HotUKDealsService.entities.allowedUser.query
    .byDiscordId({ discordId })
    .go();
  return result.data.length > 0;
}

/**
 * Check if a Discord user is an admin
 */
export async function isUserAdmin({ discordId }: IsUserAdminParams): Promise<boolean> {
  const result = await HotUKDealsService.entities.allowedUser.query
    .byDiscordId({ discordId })
    .go();
  const user = result.data[0];
  return user?.isAdmin === true;
}

/**
 * Get an allowed user by Discord ID
 */
export async function getAllowedUser({ discordId }: GetAllowedUserParams): Promise<AllowedUser | null> {
  const result = await HotUKDealsService.entities.allowedUser.query
    .byDiscordId({ discordId })
    .go();
  const data = result.data[0];
  return data ? parseAllowedUser(data) : null;
}

/**
 * Get all allowed users
 */
export async function getAllowedUsers(): Promise<AllowedUser[]> {
  const result = await HotUKDealsService.entities.allowedUser.query
    .allUsers({})
    .go();
  return parseAllowedUsers(result.data);
}

/**
 * Add a user to the allowlist
 */
export async function addAllowedUser({ discordId, addedBy, isAdmin = false }: AddAllowedUserParams): Promise<AllowedUser> {
  const result = await HotUKDealsService.entities.allowedUser
    .put({
      discordId,
      addedBy,
      isAdmin,
    })
    .go();
  return parseAllowedUser(result.data);
}

/**
 * Update a user's admin status
 */
export async function updateAllowedUserAdmin({ discordId, isAdmin }: { discordId: string; isAdmin: boolean }): Promise<void> {
  await HotUKDealsService.entities.allowedUser
    .patch({ discordId })
    .set({ isAdmin })
    .go();
}

/**
 * Update a user's profile info (username, avatar)
 */
export async function updateAllowedUserProfile({ discordId, username, avatar }: { discordId: string; username: string; avatar?: string }): Promise<void> {
  await HotUKDealsService.entities.allowedUser
    .patch({ discordId })
    .set({ username, avatar })
    .go();
}

/**
 * Remove a user from the allowlist
 */
export async function removeAllowedUser({ discordId }: RemoveAllowedUserParams): Promise<void> {
  await HotUKDealsService.entities.allowedUser
    .delete({ discordId })
    .go();
}

/**
 * Seed an admin user if no users exist (for initial setup)
 */
export async function seedAdminUser({ discordId }: { discordId: string }): Promise<AllowedUser | null> {
  // Check if any users exist
  const existingUsers = await getAllowedUsers();
  if (existingUsers.length > 0) {
    // Users already exist, don't seed
    return null;
  }

  // Create the admin user
  return addAllowedUser({
    discordId,
    addedBy: 'system',
    isAdmin: true,
  });
}
