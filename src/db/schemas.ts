import { z } from 'zod';

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

// Deal schema
export const DealSchema = z.object({
  dealId: z.string(),
  searchTerm: z.string(),
  title: z.string(),
  link: z.string(),
  price: z.string().optional(),
  merchant: z.string().optional(),
  matchDetails: z.string().optional(), // Serialized JSON of MatchDetails
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
export type Channel = z.infer<typeof ChannelSchema>;
export type SearchTermConfig = z.infer<typeof SearchTermConfigSchema>;
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
