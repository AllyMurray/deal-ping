import { HotUKDealsService } from './service';
import type { Channel, SearchTermConfig, Deal, AllowedUser, QueuedDeal, BookmarkedDeal } from './schemas';
import {
  parseChannel,
  parseChannels,
  parseSearchTermConfig,
  parseSearchTermConfigs,
  parseDeal,
  parseDeals,
  parseAllowedUser,
  parseAllowedUsers,
  parseQueuedDeal,
  parseQueuedDeals,
  parseBookmarkedDeal,
  parseBookmarkedDeals,
} from './schemas';

// ============================================================================
// Parameter Types
// ============================================================================

// Channel params
export type GetChannelsByUserParams = { userId: string };
export type GetChannelParams = { id: string };
export type UpdateChannelParams = {
  id: string;
  name?: string;
  webhookUrl?: string;
};
export type UpdateChannelLastNotificationParams = { id: string };
export type DeleteChannelParams = { id: string };
export type CreateChannelParams = {
  userId: string;
  name: string;
  webhookUrl: string;
};

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
  maxPrice?: number; // Maximum price threshold in pence
  minDiscount?: number; // Minimum discount percentage
};
export type DeleteConfigParams = { channelId: string; searchTerm: string };
export type DeleteConfigsByChannelParams = { channelId: string };

// Deal params
export type DealExistsParams = { channelId: string; id: string };
export type GetDealParams = { channelId: string; id: string };
export type GetDealsBySearchTermParams = {
  channelId: string;
  searchTerm: string;
  limit?: number;
  startTime?: number; // Filter deals from this timestamp (inclusive)
  endTime?: number; // Filter deals until this timestamp (inclusive)
};
export type CreateDealParams = {
  channelId: string;
  id: string;
  searchTerm: string;
  title: string;
  link: string;
  price?: string;
  merchant?: string;
  matchDetails?: string; // Serialized JSON of MatchDetails
  filterStatus: 'passed' | 'filtered_no_match' | 'filtered_exclude' | 'filtered_include' | 'filtered_price_too_high' | 'filtered_discount_too_low';
  filterReason?: string;
  notified?: boolean;
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
export type UpdateUserSettingsParams = {
  discordId: string;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  quietHoursTimezone?: string;
};

// QueuedDeal params
export type CreateQueuedDealParams = {
  channelId: string;
  dealId: string;
  searchTerm: string;
  title: string;
  link: string;
  price?: string;
  merchant?: string;
  matchDetails?: string;
};
export type GetQueuedDealsParams = { channelId: string };
export type DeleteQueuedDealParams = { queuedDealId: string };
export type DeleteQueuedDealsForChannelParams = { channelId: string };

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
export async function createChannel({
  userId,
  name,
  webhookUrl,
}: CreateChannelParams): Promise<Channel> {
  const result = await HotUKDealsService.entities.channel
    .put({
      userId,
      name,
      webhookUrl,
    })
    .go();
  return parseChannel(result.data);
}

/**
 * Update a channel
 */
export async function updateChannel({
  id,
  name,
  webhookUrl,
}: UpdateChannelParams): Promise<Channel> {
  const updates: {
    name?: string;
    webhookUrl?: string;
  } = {};
  if (name !== undefined) updates.name = name;
  if (webhookUrl !== undefined) updates.webhookUrl = webhookUrl;

  const result = await HotUKDealsService.entities.channel
    .patch({ channelId: id })
    .set(updates)
    .go();
  return parseChannel(result.data);
}

/**
 * Update a channel's last notification timestamp
 */
export async function updateChannelLastNotification({
  id,
}: UpdateChannelLastNotificationParams): Promise<void> {
  await HotUKDealsService.entities.channel
    .patch({ channelId: id })
    .set({ lastNotificationAt: new Date().toISOString() })
    .go();
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

// Types for duplicate detection
export interface DuplicateSearchTermInfo {
  channelId: string;
  channelName: string;
}

export type FindDuplicateSearchTermsParams = {
  searchTerm: string;
  excludeChannelId?: string;
  userId: string;
};

/**
 * Find channels that already use the same search term (for duplicate detection)
 * Returns list of channels with the same search term, excluding the current channel
 */
export async function findDuplicateSearchTerms({
  searchTerm,
  excludeChannelId,
  userId,
}: FindDuplicateSearchTermsParams): Promise<DuplicateSearchTermInfo[]> {
  // Get all configs with this search term
  const configs = await getAllConfigsForSearchTerm({ term: searchTerm });

  // Filter to only this user's configs and exclude the current channel
  const userConfigs = configs.filter(
    (c) => c.userId === userId && c.channelId !== excludeChannelId
  );

  if (userConfigs.length === 0) {
    return [];
  }

  // Get channel names for the duplicates
  const channelIds = [...new Set(userConfigs.map((c) => c.channelId))];
  const channels = await Promise.all(
    channelIds.map((id) => getChannel({ id }))
  );

  return channels
    .filter((c): c is Channel => c !== null)
    .map((c) => ({
      channelId: c.channelId,
      channelName: c.name,
    }));
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
    const updates: {
      enabled?: boolean;
      excludeKeywords?: string[];
      includeKeywords?: string[];
      caseSensitive?: boolean;
      maxPrice?: number;
      minDiscount?: number;
    } = {
      enabled: config.enabled ?? existing.enabled,
      excludeKeywords: config.excludeKeywords ?? existing.excludeKeywords,
      includeKeywords: config.includeKeywords ?? existing.includeKeywords,
      caseSensitive: config.caseSensitive ?? existing.caseSensitive,
    };
    // Only set price thresholds if provided (allows clearing by passing undefined)
    if (config.maxPrice !== undefined) updates.maxPrice = config.maxPrice;
    if (config.minDiscount !== undefined) updates.minDiscount = config.minDiscount;

    await HotUKDealsService.entities.searchTermConfig
      .patch({ channelId, searchTerm })
      .set(updates)
      .go();
  } else {
    // Create new config
    const newConfig: {
      userId: string;
      channelId: string;
      searchTerm: string;
      enabled: boolean;
      excludeKeywords: string[];
      includeKeywords: string[];
      caseSensitive: boolean;
      maxPrice?: number;
      minDiscount?: number;
    } = {
      userId,
      channelId,
      searchTerm,
      enabled: config.enabled ?? true,
      excludeKeywords: config.excludeKeywords ?? [],
      includeKeywords: config.includeKeywords ?? [],
      caseSensitive: config.caseSensitive ?? false,
    };
    if (config.maxPrice !== undefined) newConfig.maxPrice = config.maxPrice;
    if (config.minDiscount !== undefined) newConfig.minDiscount = config.minDiscount;

    await HotUKDealsService.entities.searchTermConfig
      .put(newConfig)
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
 * Check if a deal exists for a specific channel
 */
export async function dealExists({ channelId, id }: DealExistsParams): Promise<boolean> {
  const result = await HotUKDealsService.entities.deal.query
    .byChannelDeal({ channelId, dealId: id })
    .go();
  return result.data.length > 0;
}

/**
 * Get a deal by channel ID and deal ID
 */
export async function getDeal({ channelId, id }: GetDealParams): Promise<Deal | null> {
  const result = await HotUKDealsService.entities.deal.query
    .byChannelDeal({ channelId, dealId: id })
    .go();
  const data = result.data[0];
  return data ? parseDeal(data) : null;
}

/**
 * Create a new deal record for a specific channel
 */
export async function createDeal(deal: CreateDealParams): Promise<Deal> {
  const result = await HotUKDealsService.entities.deal
    .put({
      dealId: deal.id,
      channelId: deal.channelId,
      searchTerm: deal.searchTerm,
      title: deal.title,
      link: deal.link,
      price: deal.price,
      merchant: deal.merchant,
      matchDetails: deal.matchDetails,
      filterStatus: deal.filterStatus,
      filterReason: deal.filterReason,
      notified: deal.notified ?? false,
      timestamp: Date.now(),
    })
    .go();
  return parseDeal(result.data);
}

/**
 * Get deals by channel and search term (for displaying on channel page)
 *
 * Uses the byChannelSearchTerm GSI which has timestamp in the sort key,
 * allowing efficient date range filtering without table scans.
 */
export async function getDealsBySearchTerm({
  channelId,
  searchTerm,
  limit = 50,
  startTime,
  endTime,
}: GetDealsBySearchTermParams): Promise<Deal[]> {
  const query = HotUKDealsService.entities.deal.query.byChannelSearchTerm({ channelId, searchTerm });

  // Apply date range filter on sort key if provided
  // ElectroDB translates these to DynamoDB KeyConditionExpression
  let result;
  if (startTime !== undefined && endTime !== undefined) {
    result = await query
      .between({ timestamp: startTime }, { timestamp: endTime })
      .go({ limit, order: 'desc' });
  } else if (startTime !== undefined) {
    result = await query
      .gte({ timestamp: startTime })
      .go({ limit, order: 'desc' });
  } else if (endTime !== undefined) {
    result = await query
      .lte({ timestamp: endTime })
      .go({ limit, order: 'desc' });
  } else {
    result = await query.go({ limit, order: 'desc' });
  }

  return parseDeals(result.data);
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
 * Update a user's quiet hours settings
 */
export async function updateUserSettings({
  discordId,
  quietHoursEnabled,
  quietHoursStart,
  quietHoursEnd,
  quietHoursTimezone,
}: UpdateUserSettingsParams): Promise<AllowedUser> {
  const updates: {
    quietHoursEnabled?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    quietHoursTimezone?: string;
  } = {};
  if (quietHoursEnabled !== undefined) updates.quietHoursEnabled = quietHoursEnabled;
  if (quietHoursStart !== undefined) updates.quietHoursStart = quietHoursStart;
  if (quietHoursEnd !== undefined) updates.quietHoursEnd = quietHoursEnd;
  if (quietHoursTimezone !== undefined) updates.quietHoursTimezone = quietHoursTimezone;

  await HotUKDealsService.entities.allowedUser
    .patch({ discordId })
    .set(updates)
    .go();

  const updated = await getAllowedUser({ discordId });
  if (!updated) {
    throw new Error('Failed to update user settings');
  }
  return updated;
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

// ============================================================================
// QueuedDeal Repository
// ============================================================================

/**
 * Create a queued deal (for quiet hours)
 */
export async function createQueuedDeal(deal: CreateQueuedDealParams): Promise<QueuedDeal> {
  const result = await HotUKDealsService.entities.queuedDeal
    .put({
      channelId: deal.channelId,
      dealId: deal.dealId,
      searchTerm: deal.searchTerm,
      title: deal.title,
      link: deal.link,
      price: deal.price,
      merchant: deal.merchant,
      matchDetails: deal.matchDetails,
    })
    .go();
  return parseQueuedDeal(result.data);
}

/**
 * Get all queued deals for a channel
 */
export async function getQueuedDealsForChannel({ channelId }: GetQueuedDealsParams): Promise<QueuedDeal[]> {
  const result = await HotUKDealsService.entities.queuedDeal.query
    .byChannel({ channelId })
    .go({ order: 'asc' }); // Oldest first
  return parseQueuedDeals(result.data);
}

/**
 * Get all queued deals (for batch processing when quiet hours end)
 */
export async function getAllQueuedDeals(): Promise<QueuedDeal[]> {
  const result = await HotUKDealsService.entities.queuedDeal.query
    .allQueued({})
    .go();
  return parseQueuedDeals(result.data);
}

/**
 * Delete a queued deal by ID
 */
export async function deleteQueuedDeal({ queuedDealId }: DeleteQueuedDealParams): Promise<void> {
  await HotUKDealsService.entities.queuedDeal
    .delete({ queuedDealId })
    .go();
}

/**
 * Delete all queued deals for a channel (after sending them)
 */
export async function deleteQueuedDealsForChannel({ channelId }: DeleteQueuedDealsForChannelParams): Promise<void> {
  const deals = await getQueuedDealsForChannel({ channelId });
  await Promise.all(
    deals.map((deal) =>
      HotUKDealsService.entities.queuedDeal
        .delete({ queuedDealId: deal.queuedDealId })
        .go()
    )
  );
}

/**
 * Get queued deals grouped by channel
 */
export interface ChannelWithQueuedDeals {
  channelId: string;
  deals: QueuedDeal[];
}

export async function getQueuedDealsGroupedByChannel(): Promise<ChannelWithQueuedDeals[]> {
  const allDeals = await getAllQueuedDeals();

  // Group by channelId
  const grouped = allDeals.reduce(
    (acc, deal) => {
      if (!acc[deal.channelId]) {
        acc[deal.channelId] = [];
      }
      acc[deal.channelId].push(deal);
      return acc;
    },
    {} as Record<string, QueuedDeal[]>
  );

  return Object.entries(grouped).map(([channelId, deals]) => ({
    channelId,
    deals,
  }));
}

// ============================================================================
// BookmarkedDeal Repository
// ============================================================================

// BookmarkedDeal params
export type CreateBookmarkParams = {
  userId: string;
  dealId: string;
  title: string;
  link: string;
  price?: string;
  merchant?: string;
  searchTerm: string;
};
export type GetBookmarksByUserParams = { userId: string };
export type GetBookmarkParams = { bookmarkId: string };
export type IsBookmarkedParams = { userId: string; dealId: string };
export type DeleteBookmarkParams = { bookmarkId: string };
export type DeleteBookmarkByDealParams = { userId: string; dealId: string };

/**
 * Create a bookmark for a deal
 */
export async function createBookmark(params: CreateBookmarkParams): Promise<BookmarkedDeal> {
  const result = await HotUKDealsService.entities.bookmarkedDeal
    .put({
      userId: params.userId,
      dealId: params.dealId,
      title: params.title,
      link: params.link,
      price: params.price,
      merchant: params.merchant,
      searchTerm: params.searchTerm,
    })
    .go();
  return parseBookmarkedDeal(result.data);
}

/**
 * Get all bookmarks for a user (sorted by bookmark time, newest first)
 */
export async function getBookmarksByUser({ userId }: GetBookmarksByUserParams): Promise<BookmarkedDeal[]> {
  const result = await HotUKDealsService.entities.bookmarkedDeal.query
    .byUser({ userId })
    .go({ order: 'desc' });
  return parseBookmarkedDeals(result.data);
}

/**
 * Get a bookmark by ID
 */
export async function getBookmark({ bookmarkId }: GetBookmarkParams): Promise<BookmarkedDeal | null> {
  const result = await HotUKDealsService.entities.bookmarkedDeal.query
    .byBookmarkId({ bookmarkId })
    .go();
  const data = result.data[0];
  return data ? parseBookmarkedDeal(data) : null;
}

/**
 * Check if a deal is bookmarked by a user
 */
export async function isBookmarked({ userId, dealId }: IsBookmarkedParams): Promise<boolean> {
  const result = await HotUKDealsService.entities.bookmarkedDeal.query
    .byUserDeal({ userId, dealId })
    .go();
  return result.data.length > 0;
}

/**
 * Get a bookmark by user and deal ID (for removing bookmarks)
 */
export async function getBookmarkByUserDeal({ userId, dealId }: IsBookmarkedParams): Promise<BookmarkedDeal | null> {
  const result = await HotUKDealsService.entities.bookmarkedDeal.query
    .byUserDeal({ userId, dealId })
    .go();
  const data = result.data[0];
  return data ? parseBookmarkedDeal(data) : null;
}

/**
 * Delete a bookmark by ID
 */
export async function deleteBookmark({ bookmarkId }: DeleteBookmarkParams): Promise<void> {
  await HotUKDealsService.entities.bookmarkedDeal
    .delete({ bookmarkId })
    .go();
}

/**
 * Delete a bookmark by user and deal ID (toggle off)
 */
export async function deleteBookmarkByDeal({ userId, dealId }: DeleteBookmarkByDealParams): Promise<void> {
  const bookmark = await getBookmarkByUserDeal({ userId, dealId });
  if (bookmark) {
    await deleteBookmark({ bookmarkId: bookmark.bookmarkId });
  }
}
