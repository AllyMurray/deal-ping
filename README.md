# HotUKDeals Discord Notifier

A Discord bot that monitors HotUKDeals and sends deal notifications to Discord channels with support for multiple search terms, filtering, and channel management.

## Features

- 🔍 **Multiple Search Terms**: Monitor multiple keywords per Discord channel
- 📢 **Discord Notifications**: Send real-time deal notifications to Discord channels
- 🎯 **Smart Filtering**: Include/exclude deals based on keywords to avoid unwanted results
- 💰 **Deal Information**: Extract prices, merchant details, and direct links
- 🔧 **Channel Management**: Organize webhooks with friendly names
- 📊 **Grouped Messages**: Combine multiple search results into organized Discord messages
- 🌐 **Web Dashboard**: Manage channels, view deal history, and see why deals were filtered
- 🔬 **Live Filter Preview**: See in real-time which deals would be included/excluded by your search term configs
- 📈 **Filter Transparency**: All deals (passed and filtered) are stored with match details explaining why
- ⚡ **AWS Lambda**: Serverless deployment with automatic scheduling

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Deploy to AWS:**
   ```bash
   npx sst deploy
   ```

## Configuration Management

The CLI tool provides a comprehensive interface for managing channels, search terms, and filters.

### Channel Management

Channels group search terms under a friendly name with their Discord webhook URL.

```bash
# Create a new channel
pnpm run manage-config channel create "Gaming Deals" "https://discord.com/api/webhooks/..."

# List all channels
pnpm run manage-config channel list

# Update a channel name or webhook
pnpm run manage-config channel update "Gaming Deals" --name "PC Gaming"
pnpm run manage-config channel update "Gaming Deals" --webhook "https://discord.com/api/webhooks/new-url"

# Delete a channel (also removes all its search terms)
pnpm run manage-config channel delete "Gaming Deals"
```

### Search Term Management

```bash
# Add a search term to a channel
pnpm run manage-config add "Gaming Deals" steam-deck

# Add multiple search terms
pnpm run manage-config add-multiple "Gaming Deals" steam-deck ps5 xbox

# Add in disabled state
pnpm run manage-config add "Gaming Deals" nintendo --disabled

# List all configurations
pnpm run manage-config list

# List grouped by channel
pnpm run manage-config list-grouped

# Remove a search term from a channel
pnpm run manage-config remove "Gaming Deals" steam-deck

# Toggle enable/disable
pnpm run manage-config toggle "Gaming Deals" steam-deck
```

### Filtering System

Filter deals to get more relevant results.

```bash
# Exclude deals containing specific keywords
pnpm run manage-config add-filter "Gaming Deals" steam --exclude "washing,iron,kettle"

# Only include deals containing ALL specified keywords
pnpm run manage-config add-filter "Gaming Deals" laptop --include "gaming,rtx"

# Combine include and exclude filters
pnpm run manage-config add-filter "Gaming Deals" phone --exclude "case,screen protector" --include "iphone"

# Enable case-sensitive filtering
pnpm run manage-config add-filter "Gaming Deals" steam --exclude "keywords" --case-sensitive

# Remove specific filters
pnpm run manage-config remove-filter "Gaming Deals" steam --exclude "washing,iron"
```

## Common Usage Examples

### 1. Gaming Setup
```bash
# Create a gaming channel
pnpm run manage-config channel create "Gaming Deals" "$DISCORD_WEBHOOK"

# Add gaming-related search terms
pnpm run manage-config add-multiple "Gaming Deals" steam-deck ps5 xbox nintendo-switch

# Filter out non-gaming steam results
pnpm run manage-config add-filter "Gaming Deals" steam --exclude "washing,iron,kettle,boiler"
```

### 2. Tech Deals Setup
```bash
# Create a tech channel
pnpm run manage-config channel create "Tech Deals" "$TECH_WEBHOOK"

# Monitor various tech categories
pnpm run manage-config add-multiple "Tech Deals" laptop phone tablet headphones

# Filter laptop deals to exclude refurbished items
pnpm run manage-config add-filter "Tech Deals" laptop --exclude "refurbished,used,second hand"
```

### 3. Multiple Discord Channels
```bash
# Gaming channel
pnpm run manage-config channel create "Gaming" "$GAMING_WEBHOOK"
pnpm run manage-config add-multiple "Gaming" steam-deck ps5 xbox nintendo

# Tech channel
pnpm run manage-config channel create "Tech" "$TECH_WEBHOOK"
pnpm run manage-config add-multiple "Tech" laptop phone tablet

# Home appliances channel
pnpm run manage-config channel create "Home" "$HOME_WEBHOOK"
pnpm run manage-config add-multiple "Home" washing-machine dishwasher
```

### 4. View Your Setup
```bash
# See all channels
pnpm run manage-config channel list

# See all configurations grouped by channel
pnpm run manage-config list-grouped

# See individual configurations with filters
pnpm run manage-config list
```

## CLI Help

```bash
# Show all available commands
pnpm run manage-config --help

# Show usage examples
pnpm run manage-config examples

# Get help for a specific command
pnpm run manage-config channel --help
pnpm run manage-config add --help
```

## Feed Parser (Development)

For testing and development, you can use the feed parser directly:

```bash
# Search for deals by keyword
pnpm run feed-parser laptop
pnpm run feed-parser "gaming chair"
pnpm run feed-parser phone
```

## Configuration Structure

Data is stored in DynamoDB using a single-table design with ElectroDB. Types are inferred from Zod schemas:

### Channel
```typescript
export const Channel = z.object({
  channelId: z.string(),
  userId: z.string(),
  name: z.string(),            // Friendly name (e.g., "Gaming Deals")
  webhookUrl: z.string(),      // Discord webhook URL
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Channel = z.infer<typeof Channel>;
```

### SearchTermConfig
```typescript
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
```

### Deal
```typescript
export const DealFilterStatus = z.enum([
  'passed',            // Deal passed all filters, notification sent
  'filtered_no_match', // Search term not found in deal title
  'filtered_exclude',  // Contains an excluded keyword
  'filtered_include',  // Missing required include keywords
]);

export type DealFilterStatus = z.infer<typeof DealFilterStatus>;

export const Deal = z.object({
  dealId: z.string(),
  searchTerm: z.string(),
  title: z.string(),
  link: z.string(),
  price: z.string().optional(),
  merchant: z.string().optional(),
  matchDetails: z.string().optional(),  // Serialized JSON with match info
  filterStatus: DealFilterStatus.default('passed'),
  filterReason: z.string().optional(),  // Human-readable filter reason
  notified: z.boolean().default(false), // Whether notification was sent
  timestamp: z.number().optional(),
  createdAt: z.string().optional(),
  ttl: z.number().optional(),           // Auto-expires after 12 months
});

export type Deal = z.infer<typeof Deal>;
```

### FilterConfig (Client-side)
```typescript
// Used for live filter preview on channel detail page
export const FilterConfig = z.object({
  searchTerm: z.string(),
  includeKeywords: z.array(z.string()),
  excludeKeywords: z.array(z.string()),
  caseSensitive: z.boolean(),
});

export type FilterConfig = z.infer<typeof FilterConfig>;
```

## Architecture

- **AWS Lambda**: Serverless function that runs every minute
- **DynamoDB**: Single-table design with ElectroDB for data access
- **Discord Webhooks**: Sends notifications to Discord channels
- **HotUKDeals Scraping**: Parses deal data from the website
- **React Router**: Web dashboard with Discord OAuth authentication
- **SST Framework**: Infrastructure as Code deployment

## Development

- Built with **TypeScript**
- Uses **ElectroDB** for DynamoDB single-table design
- Uses **Zod** for runtime type validation
- Uses **Cheerio** for HTML parsing
- Uses **Undici** for HTTP requests
- Uses **Commander.js** for CLI interface
- Uses **Chalk** for colored terminal output
- Uses **Ora** for loading spinners
- Uses **Mantine** for UI components
- Uses **React Router v7** for web framework
- Targets **AWS Lambda** deployment with **SST v3**

## License

ISC
