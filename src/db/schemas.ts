import { z } from 'zod';

// ============================================================================
// Match Details Schemas
// ============================================================================

// MatchSegment schema - represents a text segment containing a match
export const MatchSegmentSchema = z.object({
  text: z.string(), // The segment of text containing the match
  matchedTerm: z.string(), // What term was matched
  position: z.enum(['title', 'merchant']), // Where it was found
});

// MatchDetails schema - detailed match information for a deal
export const MatchDetailsSchema = z.object({
  searchText: z.string(), // Combined title + merchant that was searched
  matchedSegments: z.array(MatchSegmentSchema), // Text snippets showing matches
  searchTermMatches: z.array(z.string()), // Parts of search term found in deal
  includeKeywordMatches: z.array(z.string()), // Which include keywords were found
  excludeKeywordStatus: z.string(), // Status of exclude keyword check
  filterStatus: z.string(), // Overall filter status explanation
});

// MatchFilterConfig schema - configuration for match filtering
export const MatchFilterConfigSchema = z.object({
  searchTerm: z.string(),
  includeKeywords: z.array(z.string()).optional(),
  excludeKeywords: z.array(z.string()).optional(),
  caseSensitive: z.boolean().optional(),
});

// ============================================================================
// Entity Schemas
// ============================================================================

// Channel schema
export const ChannelSchema = z.object({
  channelId: z.string(),
  userId: z.string(),
  name: z.string(),
  webhookUrl: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// SearchTermConfig schema
export const SearchTermConfigSchema = z.object({
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

// Deal filter status enum
export const DealFilterStatusSchema = z.enum([
  'passed',
  'filtered_no_match',
  'filtered_exclude',
  'filtered_include',
]);

// Deal schema
export const DealSchema = z.object({
  dealId: z.string(),
  searchTerm: z.string(),
  title: z.string(),
  link: z.string(),
  price: z.string().optional(),
  merchant: z.string().optional(),
  matchDetails: z.string().optional(), // Serialized JSON of MatchDetails
  filterStatus: DealFilterStatusSchema.default('passed'),
  filterReason: z.string().optional(), // Human-readable reason for filtering
  notified: z.boolean().default(false), // Whether a notification was sent
  timestamp: z.number().optional(),
  createdAt: z.string().optional(),
  ttl: z.number().optional(),
});

// AllowedUser schema
export const AllowedUserSchema = z.object({
  discordId: z.string(),
  username: z.string().optional(),
  avatar: z.string().optional(),
  isAdmin: z.boolean().default(false),
  addedBy: z.string(),
  addedAt: z.string().optional(),
});

// Inferred types from schemas
export type MatchSegment = z.infer<typeof MatchSegmentSchema>;
export type MatchDetails = z.infer<typeof MatchDetailsSchema>;
export type MatchFilterConfig = z.infer<typeof MatchFilterConfigSchema>;
export type Channel = z.infer<typeof ChannelSchema>;
export type SearchTermConfig = z.infer<typeof SearchTermConfigSchema>;
export type DealFilterStatus = z.infer<typeof DealFilterStatusSchema>;
export type Deal = z.infer<typeof DealSchema>;
export type AllowedUser = z.infer<typeof AllowedUserSchema>;

// Parse functions with defaults applied
export function parseChannel(data: unknown): Channel {
  return ChannelSchema.parse(data);
}

export function parseSearchTermConfig(data: unknown): SearchTermConfig {
  return SearchTermConfigSchema.parse(data);
}

export function parseDeal(data: unknown): Deal {
  return DealSchema.parse(data);
}

export function parseAllowedUser(data: unknown): AllowedUser {
  return AllowedUserSchema.parse(data);
}

// Safe parse functions for arrays
export function parseChannels(data: unknown[]): Channel[] {
  return data.map((item) => ChannelSchema.parse(item));
}

export function parseSearchTermConfigs(data: unknown[]): SearchTermConfig[] {
  return data.map((item) => SearchTermConfigSchema.parse(item));
}

export function parseDeals(data: unknown[]): Deal[] {
  return data.map((item) => DealSchema.parse(item));
}

export function parseAllowedUsers(data: unknown[]): AllowedUser[] {
  return data.map((item) => AllowedUserSchema.parse(item));
}
