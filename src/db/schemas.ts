import { z } from 'zod';

// ============================================================================
// Match Details Schemas
// ============================================================================

// MatchSegment - represents a text segment containing a match
export const MatchSegment = z.object({
  text: z.string(), // The segment of text containing the match
  matchedTerm: z.string(), // What term was matched
  position: z.enum(['title', 'merchant']), // Where it was found
});

export type MatchSegment = z.infer<typeof MatchSegment>;

// MatchDetails - detailed match information for a deal
export const MatchDetails = z.object({
  searchText: z.string(), // Combined title + merchant that was searched
  matchedSegments: z.array(MatchSegment), // Text snippets showing matches
  searchTermMatches: z.array(z.string()), // Parts of search term found in deal
  includeKeywordMatches: z.array(z.string()), // Which include keywords were found
  excludeKeywordStatus: z.string(), // Status of exclude keyword check
  filterStatus: z.string(), // Overall filter status explanation
});

export type MatchDetails = z.infer<typeof MatchDetails>;

// MatchFilterConfig - configuration for match filtering
export const MatchFilterConfig = z.object({
  searchTerm: z.string(),
  includeKeywords: z.array(z.string()).optional(),
  excludeKeywords: z.array(z.string()).optional(),
  caseSensitive: z.boolean().optional(),
});

export type MatchFilterConfig = z.infer<typeof MatchFilterConfig>;

// ============================================================================
// Entity Schemas
// ============================================================================

// Channel
export const Channel = z.object({
  channelId: z.string(),
  userId: z.string(),
  name: z.string(),
  webhookUrl: z.string(),
  quietHoursEnabled: z.boolean().default(false),
  quietHoursStart: z.string().optional(), // HH:mm format (e.g., "22:00")
  quietHoursEnd: z.string().optional(), // HH:mm format (e.g., "08:00")
  quietHoursTimezone: z.string().default('Europe/London'), // IANA timezone
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Channel = z.infer<typeof Channel>;

// SearchTermConfig
export const SearchTermConfig = z.object({
  channelId: z.string(),
  userId: z.string(),
  searchTerm: z.string(),
  enabled: z.boolean().default(true),
  excludeKeywords: z.array(z.string()).default([]),
  includeKeywords: z.array(z.string()).default([]),
  caseSensitive: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type SearchTermConfig = z.infer<typeof SearchTermConfig>;

// DealFilterStatus enum
export const DealFilterStatus = z.enum([
  'passed',
  'filtered_no_match',
  'filtered_exclude',
  'filtered_include',
]);

export type DealFilterStatus = z.infer<typeof DealFilterStatus>;

// Deal
export const Deal = z.object({
  dealId: z.string(),
  searchTerm: z.string(),
  title: z.string(),
  link: z.string(),
  price: z.string().optional(),
  merchant: z.string().optional(),
  matchDetails: z.string().optional(), // Serialized JSON of MatchDetails
  filterStatus: DealFilterStatus.default('passed'),
  filterReason: z.string().optional(), // Human-readable reason for filtering
  notified: z.boolean().default(false), // Whether a notification was sent
  timestamp: z.number().optional(),
  createdAt: z.string().optional(),
  ttl: z.number().optional(),
});

export type Deal = z.infer<typeof Deal>;

// AllowedUser
export const AllowedUser = z.object({
  discordId: z.string(),
  username: z.string().optional(),
  avatar: z.string().optional(),
  isAdmin: z.boolean().default(false),
  addedBy: z.string(),
  addedAt: z.string().optional(),
});

export type AllowedUser = z.infer<typeof AllowedUser>;

// QueuedDeal - deals waiting to be sent after quiet hours
export const QueuedDeal = z.object({
  queuedDealId: z.string(),
  channelId: z.string(),
  dealId: z.string(),
  searchTerm: z.string(),
  title: z.string(),
  link: z.string(),
  price: z.string().optional(),
  merchant: z.string().optional(),
  matchDetails: z.string().optional(),
  queuedAt: z.number().optional(),
  createdAt: z.string().optional(),
  ttl: z.number().optional(),
});

export type QueuedDeal = z.infer<typeof QueuedDeal>;

// Parse functions with defaults applied
export function parseChannel(data: unknown): Channel {
  return Channel.parse(data);
}

export function parseSearchTermConfig(data: unknown): SearchTermConfig {
  return SearchTermConfig.parse(data);
}

export function parseDeal(data: unknown): Deal {
  return Deal.parse(data);
}

export function parseAllowedUser(data: unknown): AllowedUser {
  return AllowedUser.parse(data);
}

export function parseQueuedDeal(data: unknown): QueuedDeal {
  return QueuedDeal.parse(data);
}

// Safe parse functions for arrays
export function parseChannels(data: unknown[]): Channel[] {
  return data.map((item) => Channel.parse(item));
}

export function parseSearchTermConfigs(data: unknown[]): SearchTermConfig[] {
  return data.map((item) => SearchTermConfig.parse(item));
}

export function parseDeals(data: unknown[]): Deal[] {
  return data.map((item) => Deal.parse(item));
}

export function parseAllowedUsers(data: unknown[]): AllowedUser[] {
  return data.map((item) => AllowedUser.parse(item));
}

export function parseQueuedDeals(data: unknown[]): QueuedDeal[] {
  return data.map((item) => QueuedDeal.parse(item));
}
