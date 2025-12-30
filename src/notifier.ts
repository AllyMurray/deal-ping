import type { Handler } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import middy from '@middy/core';
import { request } from 'undici';
import { fetchDeals, type Deal } from './feed-parser';
import {
  getEnabledConfigsGroupedByChannel,
  dealExists,
  createDeal,
  createQueuedDeal,
  getQueuedDealsForChannel,
  deleteQueuedDealsForChannel,
  getAllChannels,
  getAllowedUsers,
  updateChannelLastNotification,
  type ChannelWithConfigs,
} from './db';
import type { Channel, QueuedDeal, AllowedUser, SearchTermConfig, DealFilterStatus } from './db/schemas';
import type { DiscordEmbed, DiscordWebhookPayload } from './discord-types';
import {
  computeMatchDetails,
  formatMatchSummary,
  serializeMatchDetails,
  type MatchDetails,
} from './match-details';
import { isWithinQuietHours, didQuietHoursJustEnd } from './quiet-hours';

const logger = new Logger({ serviceName: 'HotUKDealsNotifier' });

// Re-export from schemas for backwards compatibility
export type FilterStatus = DealFilterStatus;

interface DealWithSearchTerm {
  id: string;
  title: string;
  link: string;
  price?: string;
  originalPrice?: string;
  merchant?: string;
  merchantUrl?: string;
  timestamp?: number;
  score?: number;
  temperature?: 'hot' | 'warm' | 'cold';
  commentCount?: number;
  savings?: string;
  savingsPercentage?: number;
  searchTerm: string;
  matchDetails?: MatchDetails;
  matchDetailsSerialized?: string;
  filterStatus: FilterStatus;
  filterReason?: string;
}

export interface FilterResult {
  passed: boolean;
  filterStatus: FilterStatus;
  filterReason?: string;
  matchDetails: MatchDetails;
}

// Helper function to parse price string to pence
// Handles formats like "£50.00", "£50", "50.00", "£1,234.56"
export const parsePriceToPence = (priceString?: string): number | null => {
  if (!priceString) return null;

  // Remove currency symbols and whitespace
  const cleaned = priceString.replace(/[£$€\s,]/g, '');

  // Try to parse as a number
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) return null;

  // Convert to pence (integer)
  return Math.round(parsed * 100);
};

// Simple in-memory cache (optional optimization)
let configCache: {
  configs: ChannelWithConfigs[];
  lastFetch: number;
  ttl: number;
} = {
  configs: [],
  lastFetch: 0,
  ttl: 5 * 60 * 1000, // 5 minutes cache
};

// Get all search term configurations from DynamoDB (grouped by channel)
const getGroupedConfigs = async (): Promise<ChannelWithConfigs[]> => {
  // Optional: Use cache to reduce DynamoDB calls
  const now = Date.now();
  if (configCache.configs.length > 0 && now - configCache.lastFetch < configCache.ttl) {
    logger.debug('Using cached search term configs');
    return configCache.configs;
  }

  try {
    const groupedConfigs = await getEnabledConfigsGroupedByChannel();

    // Update cache
    configCache.configs = groupedConfigs;
    configCache.lastFetch = now;

    return groupedConfigs;
  } catch (error) {
    logger.error('Error fetching search term configs', { error });
    // Return cached configs if available, otherwise empty array
    return configCache.configs.length > 0 ? configCache.configs : [];
  }
};

// Filter deals based on include/exclude keywords, price thresholds, and compute match details
// Exported for testing
export const filterDeal = (deal: Deal, config: SearchTermConfig): FilterResult => {
  const title = config.caseSensitive ? deal.title : deal.title.toLowerCase();
  const merchant = config.caseSensitive ? (deal.merchant || '') : (deal.merchant || '').toLowerCase();

  // Combine title and merchant for filtering
  const searchText = `${title} ${merchant}`.trim();

  // Compute match details regardless of filter outcome
  const matchDetails = computeMatchDetails(deal.title, deal.merchant, {
    searchTerm: config.searchTerm,
    includeKeywords: config.includeKeywords,
    excludeKeywords: config.excludeKeywords,
    caseSensitive: config.caseSensitive,
    fuzzyMatch: config.fuzzyMatch,
  });

  // Check that the search term appears in the deal
  // When fuzzyMatch is enabled, match if any word from the search term is found
  // When fuzzyMatch is disabled (default), the entire search term must be present
  let hasSearchTermMatch: boolean;

  if (config.fuzzyMatch) {
    // Fuzzy match: any word from the search term matches
    const searchTermWords = config.searchTerm.split(/\s+/).filter((w) => w.length > 0);
    const normalizedSearchTermWords = config.caseSensitive
      ? searchTermWords
      : searchTermWords.map((w) => w.toLowerCase());
    hasSearchTermMatch = normalizedSearchTermWords.some((word) => searchText.includes(word));
  } else {
    // Exact phrase match: entire search term must be present
    const normalizedSearchTerm = config.caseSensitive
      ? config.searchTerm
      : config.searchTerm.toLowerCase();
    hasSearchTermMatch = searchText.includes(normalizedSearchTerm);
  }

  if (!hasSearchTermMatch) {
    const filterReason = config.fuzzyMatch
      ? `No words from search term "${config.searchTerm}" found in deal`
      : `Search term "${config.searchTerm}" not found in deal`;
    logger.debug('Deal filtered out - search term not found in deal', {
      dealTitle: deal.title,
      searchTerm: config.searchTerm,
      fuzzyMatch: config.fuzzyMatch,
      matchDetails,
    });
    return {
      passed: false,
      filterStatus: 'filtered_no_match',
      filterReason,
      matchDetails,
    };
  }

  // Check exclude keywords
  if (config.excludeKeywords && config.excludeKeywords.length > 0) {
    const excludeWords = config.caseSensitive
      ? config.excludeKeywords
      : config.excludeKeywords.map((keyword) => keyword.toLowerCase());

    const matchedExclude = excludeWords.find((keyword) => searchText.includes(keyword));
    if (matchedExclude) {
      const filterReason = `Excluded keyword "${matchedExclude}" found in deal`;
      logger.debug('Deal filtered out by exclude keywords', {
        dealTitle: deal.title,
        excludeKeywords: config.excludeKeywords,
        searchTerm: config.searchTerm,
        matchDetails,
      });
      return {
        passed: false,
        filterStatus: 'filtered_exclude',
        filterReason,
        matchDetails,
      };
    }
  }

  // Check include keywords (all must be present if specified)
  if (config.includeKeywords && config.includeKeywords.length > 0) {
    const includeWords = config.caseSensitive
      ? config.includeKeywords
      : config.includeKeywords.map((keyword) => keyword.toLowerCase());

    const missingKeywords = includeWords.filter((keyword) => !searchText.includes(keyword));
    if (missingKeywords.length > 0) {
      const filterReason = `Required keyword(s) not found: ${missingKeywords.join(', ')}`;
      logger.debug('Deal filtered out by include keywords', {
        dealTitle: deal.title,
        includeKeywords: config.includeKeywords,
        missingKeywords,
        searchTerm: config.searchTerm,
        matchDetails,
      });
      return {
        passed: false,
        filterStatus: 'filtered_include',
        filterReason,
        matchDetails,
      };
    }
  }

  // Check price threshold (maxPrice is in pence)
  if (config.maxPrice !== undefined && config.maxPrice !== null) {
    const dealPriceInPence = parsePriceToPence(deal.price);
    if (dealPriceInPence !== null && dealPriceInPence > config.maxPrice) {
      const maxPriceFormatted = `£${(config.maxPrice / 100).toFixed(2)}`;
      const filterReason = `Price ${deal.price} exceeds maximum ${maxPriceFormatted}`;
      logger.debug('Deal filtered out by price threshold', {
        dealTitle: deal.title,
        dealPrice: deal.price,
        dealPriceInPence,
        maxPrice: config.maxPrice,
        searchTerm: config.searchTerm,
        matchDetails,
      });
      return {
        passed: false,
        filterStatus: 'filtered_price_too_high',
        filterReason,
        matchDetails,
      };
    }
  }

  // Check minimum discount threshold
  if (config.minDiscount !== undefined && config.minDiscount !== null) {
    const dealDiscount = deal.savingsPercentage;
    // If deal has no discount info or discount is below threshold, filter it out
    if (dealDiscount === undefined || dealDiscount < config.minDiscount) {
      const filterReason = dealDiscount !== undefined
        ? `Discount ${dealDiscount}% is below minimum ${config.minDiscount}%`
        : `No discount information available (minimum ${config.minDiscount}% required)`;
      logger.debug('Deal filtered out by discount threshold', {
        dealTitle: deal.title,
        dealDiscount,
        minDiscount: config.minDiscount,
        searchTerm: config.searchTerm,
        matchDetails,
      });
      return {
        passed: false,
        filterStatus: 'filtered_discount_too_low',
        filterReason,
        matchDetails,
      };
    }
  }

  return { passed: true, filterStatus: 'passed', matchDetails };
};

// Helper function to process multiple search terms for a channel
const processChannelFeeds = async (
  channelWithConfigs: ChannelWithConfigs,
  userSettings: AllowedUser | undefined
): Promise<void> => {
  const { channel, configs } = channelWithConfigs;
  const searchTerms = configs.map((c) => c.searchTerm);
  logger.info('Processing search terms for channel', {
    channelName: channel.name,
    channelId: channel.channelId,
    searchTerms,
  });

  try {
    // Collect all deals from all search terms first
    const allDealsWithConfig: Array<{ deal: Deal; searchConfig: SearchTermConfig }> = [];

    for (const searchConfig of configs) {
      const { searchTerm } = searchConfig;
      logger.info('Fetching deals for search term', { searchTerm });

      const deals = await fetchDeals(searchTerm);
      for (const deal of deals) {
        allDealsWithConfig.push({ deal, searchConfig });
      }
    }

    if (allDealsWithConfig.length === 0) {
      logger.info('No deals found for channel', {
        channelName: channel.name,
        searchTerms,
      });
      return;
    }

    // Batch check existence for all deals
    const existenceChecks = await Promise.all(
      allDealsWithConfig.map(async ({ deal }) => ({
        dealId: deal.id,
        exists: await dealExists({ id: deal.id }),
      }))
    );

    const existsMap = new Map(existenceChecks.map((check) => [check.dealId, check.exists]));

    // Process deals that don't exist - store all deals (passed and filtered)
    const allNewDeals: DealWithSearchTerm[] = [];

    for (const { deal, searchConfig } of allDealsWithConfig) {
      const dealId = deal.id;

      if (existsMap.get(dealId)) {
        logger.debug('Deal already exists, skipping', { dealId, searchTerm: searchConfig.searchTerm });
        continue;
      }

      // Apply filtering logic and get match details
      const filterResult = filterDeal(deal, searchConfig);

      if (filterResult.passed) {
        logger.info('New deal found (passed filters)', {
          title: deal.title,
          link: deal.link,
          price: deal.price,
          merchant: deal.merchant,
          searchTerm: searchConfig.searchTerm,
          matchDetails: filterResult.matchDetails,
        });
      } else {
        logger.debug('Deal filtered out', {
          dealId,
          title: deal.title,
          searchTerm: searchConfig.searchTerm,
          filterStatus: filterResult.filterStatus,
          filterReason: filterResult.filterReason,
          matchDetails: filterResult.matchDetails,
        });
      }

      // Store all deals regardless of filter status
      allNewDeals.push({
        ...deal,
        searchTerm: searchConfig.searchTerm,
        matchDetails: filterResult.matchDetails,
        matchDetailsSerialized: serializeMatchDetails(filterResult.matchDetails),
        filterStatus: filterResult.filterStatus,
        filterReason: filterResult.filterReason,
      });
    }

    // Batch create all new deals (passed and filtered)
    if (allNewDeals.length > 0) {
      // Separate passed deals for notification
      const passedDeals = allNewDeals.filter((d) => d.filterStatus === 'passed');

      await Promise.all(
        allNewDeals.map((deal) =>
          createDeal({
            id: deal.id,
            searchTerm: deal.searchTerm,
            title: deal.title,
            link: deal.link,
            price: deal.price,
            merchant: deal.merchant,
            matchDetails: deal.matchDetailsSerialized,
            filterStatus: deal.filterStatus,
            filterReason: deal.filterReason,
            notified: deal.filterStatus === 'passed',
          })
        )
      );

      // Handle passed deals - either send or queue based on user's quiet hours
      if (passedDeals.length > 0) {
        const inQuietHours = userSettings ? isWithinQuietHours(userSettings) : false;

        if (inQuietHours) {
          // Queue deals for later
          logger.info('User is in quiet hours, queuing deals', {
            channelName: channel.name,
            dealCount: passedDeals.length,
            quietHoursStart: userSettings?.quietHoursStart,
            quietHoursEnd: userSettings?.quietHoursEnd,
          });

          await Promise.all(
            passedDeals.map((deal) =>
              createQueuedDeal({
                channelId: channel.channelId,
                dealId: deal.id,
                searchTerm: deal.searchTerm,
                title: deal.title,
                link: deal.link,
                price: deal.price,
                merchant: deal.merchant,
                matchDetails: deal.matchDetailsSerialized,
              })
            )
          );
        } else {
          // Send notifications immediately
          await sendCombinedDiscordMessage(channel.webhookUrl, passedDeals, channel.channelId);
        }
      }

      logger.info('Processed deals for channel', {
        channelName: channel.name,
        totalNewDeals: allNewDeals.length,
        passedDeals: passedDeals.length,
        filteredDeals: allNewDeals.length - passedDeals.length,
        quietHoursActive: userSettings ? isWithinQuietHours(userSettings) : false,
      });
    } else {
      logger.info('No new deals found for channel', {
        channelName: channel.name,
        searchTerms,
      });
    }
  } catch (error) {
    logger.error('Error processing deals for channel', {
      error,
      channelName: channel.name,
      channelId: channel.channelId,
      searchTerms,
    });
  }
};

// Helper function to get random deal color
const getDealColor = (): number => {
  const colors = [
    0x4caf50, // Green
    0x2196f3, // Blue
    0xff9800, // Orange
    0x9c27b0, // Purple
    0xf44336, // Red
    0x00bcd4, // Cyan
    0x8bc34a, // Light Green
    0x3f51b5, // Indigo
    0xff5722, // Deep Orange
    0x607d8b, // Blue Grey
  ];

  return colors[Math.floor(Math.random() * colors.length)];
};

// Format price display with savings
const formatPrice = (deal: DealWithSearchTerm): string => {
  let priceText = '';

  if (deal.price) {
    priceText += `💰 **${deal.price}**`;

    if (deal.originalPrice && deal.savings) {
      priceText += ` ~~${deal.originalPrice}~~`;
      priceText += ` (Save ${deal.savings}`;
      if (deal.savingsPercentage) {
        priceText += ` - ${deal.savingsPercentage}% off`;
      }
      priceText += ')';
    }
  }

  return priceText;
};

// Create Discord embed for a single deal
const createDealEmbed = (deal: DealWithSearchTerm): DiscordEmbed => {
  const fields: DiscordEmbed['fields'] = [];

  // Add price information
  const priceInfo = formatPrice(deal);
  if (priceInfo) {
    fields.push({
      name: 'Price',
      value: priceInfo,
      inline: true,
    });
  }

  // Add merchant information
  if (deal.merchant) {
    let merchantText = `🏪 ${deal.merchant}`;
    if (deal.merchantUrl) {
      merchantText = `🏪 [${deal.merchant}](${deal.merchantUrl})`;
    }
    fields.push({
      name: 'Merchant',
      value: merchantText,
      inline: true,
    });
  }

  // Add match details if available
  if (deal.matchDetails) {
    const matchSummary = formatMatchSummary(deal.matchDetails);
    fields.push({
      name: 'Why Matched',
      value: `🔍 ${matchSummary}`,
      inline: false,
    });
  }

  return {
    title: deal.title,
    url: deal.link,
    color: getDealColor(),
    fields,
    footer: {
      text: `Search Term: ${deal.searchTerm}`,
    },
    timestamp: new Date().toISOString(),
  };
};

// Format a single deal for the content preview (lock screen friendly)
const formatDealPreview = (deal: DealWithSearchTerm): string => {
  let preview = deal.title;

  // Truncate long titles
  if (preview.length > 60) {
    preview = preview.substring(0, 57) + '...';
  }

  // Add price and merchant inline
  const details: string[] = [];
  if (deal.price) details.push(deal.price);
  if (deal.merchant) details.push(deal.merchant);

  if (details.length > 0) {
    preview += ` - ${details.join(' @ ')}`;
  }

  return preview;
};

// Create content string optimized for lock screen visibility
const createLockScreenContent = (deals: DealWithSearchTerm[]): string => {
  const searchTerms = Array.from(new Set(deals.map((d) => d.searchTerm)));
  const searchTermsText = searchTerms.join(', ');

  if (deals.length === 1) {
    // Single deal: show full details
    const deal = deals[0];
    let content = `🆕 **${searchTermsText}**\n`;

    // Price and merchant on same line
    const details: string[] = [];
    if (deal.price) details.push(`💰 ${deal.price}`);
    if (deal.merchant) details.push(`🏪 ${deal.merchant}`);
    if (details.length > 0) {
      content += `${details.join('  •  ')}\n`;
    }

    // Title (truncate if too long)
    let title = deal.title;
    if (title.length > 80) {
      title = title.substring(0, 77) + '...';
    }
    content += `> ${title}`;

    return content;
  }

  // Multiple deals: show list with key info
  let content = `🆕 **${deals.length} new deals** for **${searchTermsText}**\n`;

  // Show up to 5 deals in the preview
  const previewDeals = deals.slice(0, 5);
  for (const deal of previewDeals) {
    content += `• ${formatDealPreview(deal)}\n`;
  }

  // Indicate if there are more deals
  if (deals.length > 5) {
    content += `_...and ${deals.length - 5} more_`;
  }

  return content.trim();
};

// Send combined Discord message for all new deals using rich embeds
const sendCombinedDiscordMessage = async (
  webhookUrl: string,
  deals: DealWithSearchTerm[],
  channelId: string
): Promise<void> => {
  try {
    const totalDeals = deals.length;
    const searchTerms = Array.from(new Set(deals.map((d) => d.searchTerm)));

    // Discord allows up to 10 embeds per message, so we need to batch them
    const maxEmbedsPerMessage = 10;
    const dealChunks: DealWithSearchTerm[][] = [];

    for (let i = 0; i < deals.length; i += maxEmbedsPerMessage) {
      dealChunks.push(deals.slice(i, i + maxEmbedsPerMessage));
    }

    for (let chunkIndex = 0; chunkIndex < dealChunks.length; chunkIndex++) {
      const chunk = dealChunks[chunkIndex];
      const embeds = chunk.map(createDealEmbed);

      // Create lock screen friendly content for the first message
      let content = '';
      if (chunkIndex === 0) {
        content = createLockScreenContent(deals);
      }

      const payload: DiscordWebhookPayload = { embeds };
      if (content) payload.content = content;

      await request(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Small delay between messages to avoid rate limiting
      if (chunkIndex < dealChunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Update channel's last notification timestamp
    await updateChannelLastNotification({ id: channelId });

    logger.info('Enhanced Discord message sent successfully', {
      webhookUrl: webhookUrl.substring(0, 50) + '...',
      dealCount: totalDeals,
      searchTerms,
      messageChunks: dealChunks.length,
    });
  } catch (error) {
    logger.error('Error sending Discord message', {
      error,
      webhookUrl: webhookUrl.substring(0, 50) + '...',
    });
  }
};

// Convert queued deals to DealWithSearchTerm format for sending
const queuedDealsToDealWithSearchTerm = (deals: QueuedDeal[]): DealWithSearchTerm[] => {
  return deals.map((deal) => ({
    id: deal.dealId,
    title: deal.title,
    link: deal.link,
    price: deal.price,
    merchant: deal.merchant,
    searchTerm: deal.searchTerm,
    matchDetailsSerialized: deal.matchDetails,
    filterStatus: 'passed' as FilterStatus,
  }));
};

// Process queued deals for users where quiet hours just ended
const processQueuedDeals = async (
  channels: Channel[],
  userSettingsMap: Map<string, AllowedUser>
): Promise<void> => {
  // Track which users have had their quiet hours end
  const usersWithEndedQuietHours = new Set<string>();

  for (const user of userSettingsMap.values()) {
    if (didQuietHoursJustEnd(user)) {
      usersWithEndedQuietHours.add(user.discordId);
    }
  }

  if (usersWithEndedQuietHours.size === 0) {
    return; // No users have quiet hours ending
  }

  // Find channels belonging to users whose quiet hours just ended
  for (const channel of channels) {
    if (!usersWithEndedQuietHours.has(channel.userId)) {
      continue;
    }

    const userSettings = userSettingsMap.get(channel.userId);

    // Get queued deals for this channel
    const queuedDeals = await getQueuedDealsForChannel({ channelId: channel.channelId });

    if (queuedDeals.length === 0) {
      logger.debug('No queued deals to send for channel', {
        channelName: channel.name,
        channelId: channel.channelId,
      });
      continue;
    }

    logger.info('Quiet hours ended, sending queued deals', {
      channelName: channel.name,
      channelId: channel.channelId,
      dealCount: queuedDeals.length,
      quietHoursEnd: userSettings?.quietHoursEnd,
    });

    try {
      // Convert to DealWithSearchTerm format
      const dealsToSend = queuedDealsToDealWithSearchTerm(queuedDeals);

      // Send the queued deals
      await sendCombinedDiscordMessage(channel.webhookUrl, dealsToSend, channel.channelId);

      // Delete the queued deals after successful send
      await deleteQueuedDealsForChannel({ channelId: channel.channelId });

      logger.info('Successfully sent queued deals after quiet hours', {
        channelName: channel.name,
        dealCount: queuedDeals.length,
      });
    } catch (error) {
      logger.error('Error sending queued deals', {
        error,
        channelName: channel.name,
        channelId: channel.channelId,
      });
    }
  }
};

// Base Lambda handler
const baseHandler: Handler = async () => {
  // Get all search term configurations grouped by channel and all users in parallel
  const [groupedConfigs, allUsers, allChannels] = await Promise.all([
    getGroupedConfigs(),
    getAllowedUsers(),
    getAllChannels(),
  ]);

  // Create a map of userId -> user settings for quick lookup
  const userSettingsMap = new Map(allUsers.map((u) => [u.discordId, u]));

  // First, check if any users have quiet hours that just ended and send queued deals
  await processQueuedDeals(allChannels, userSettingsMap);

  if (groupedConfigs.length === 0) {
    logger.warn('No search term configurations found');
    return;
  }

  const totalSearchTerms = groupedConfigs.reduce((acc, g) => acc + g.configs.length, 0);

  logger.info('Processing deals for grouped channel configurations', {
    channelCount: groupedConfigs.length,
    totalSearchTerms,
    channels: groupedConfigs.map((g) => ({
      name: g.channel.name,
      searchTerms: g.configs.map((c) => c.searchTerm),
    })),
  });

  // Process all channels concurrently, passing user settings for each channel
  await Promise.all(
    groupedConfigs.map((config) =>
      processChannelFeeds(config, userSettingsMap.get(config.channel.userId))
    )
  );
};

export const handler = middy(baseHandler).use(injectLambdaContext(logger));
