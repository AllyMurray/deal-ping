# HotUKDeals Discord Notifier

A Discord bot that monitors HotUKDeals and sends deal notifications to Discord channels with support for multiple search terms, filtering, and channel management.

## Features

- 🔍 **Multiple Search Terms**: Monitor multiple keywords per Discord channel
- 📢 **Discord Notifications**: Send real-time deal notifications to Discord channels
- 🎯 **Smart Filtering**: Include/exclude deals based on keywords to avoid unwanted results
- 🔤 **Flexible Matching**: Choose between exact phrase matching (default) or fuzzy word-based matching
- 💷 **Price Thresholds**: Only notify when deals are under a maximum price or meet a minimum discount percentage
- 🌙 **Quiet Hours**: Account-level setting to pause notifications during specified hours (deals are queued and sent when quiet hours end)
- ⚠️ **Duplicate Detection**: Warns when adding search terms that already exist in other channels
- 🕐 **Last Notification Timestamp**: See when each channel last sent a notification
- 📅 **Date Range Filter**: Filter deal history by time period (Today, Last 7 days, Last 30 days, All time)
- 📋 **Search Terms Overview**: Dedicated page showing all search terms across all channels with status and filters
- 🔖 **Deal Bookmarking**: Save interesting deals for later reference with a dedicated bookmarks page
- 💰 **Deal Information**: Extract prices, merchant details, and direct links
- 🔧 **Channel Management**: Organize webhooks with friendly names
- 📊 **Grouped Messages**: Combine multiple search results into organized Discord messages
- 🌐 **Web Dashboard**: Manage channels, view deal history, and see why deals were filtered
- 🔬 **Live Filter Preview**: See in real-time which deals would be included/excluded by your search term configs
- 👁️ **Notification Preview**: Preview how your Discord notifications will look before deals arrive
- 📈 **Filter Transparency**: All deals (passed and filtered) are stored with match details explaining why
- ⚡ **AWS Lambda**: Serverless deployment with automatic scheduling

## Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Deploy to AWS:**
   ```bash
   bunx sst deploy
   ```

## Secret scanning

Run `bun run secrets:setup` after cloning to install the local pre-commit hook.
The scanner downloads Betterleaks v1.10.0 into ignored `.tools/` and verifies
its release checksum. macOS and Linux on ARM64 and x64 are supported; Bun,
curl, tar, and a SHA-256 utility are required.

- `bun run secrets:scan`: scan tracked and untracked source files, respecting Git ignore rules.
- `bun run secrets:staged`: scan staged changes, also run automatically by the commit hook.
- `bun run secrets:history`: audit all local Git history, including merge changes.
- `bun run secrets:test`: verify webhook detection, upstream rules, staged scanning, and redaction.

Rules live in `.betterleaks.toml`. It extends the complete upstream ruleset
with a Discord webhook URL rule, including legacy domains and versioned API paths.
All commands redact findings and disable live credential validation.
Ignored local data is excluded from source scans; history scans still report old
committed credentials, including revoked ones. Do not commit scanner reports.

The Secret scanning workflow checks source files and new commits on pull requests
and pushes to main. Both deployment workflows scan source before obtaining AWS
credentials. Configure the **Secret scanning / Scan secrets** check as required
in GitHub branch rules to prevent merges when scanning fails. Local hooks must be
installed per clone and can be bypassed; CI provides an independent check.

## Configuration Management

The CLI tool provides a comprehensive interface for managing channels, search terms, and filters.

### Channel Management

Channels group search terms under a friendly name with their Discord webhook URL.

```bash
# Create a new channel
bun run manage-config channel create "Gaming Deals" "https://discord.com/api/webhooks/..."

# List all channels
bun run manage-config channel list

# Update a channel name or webhook
bun run manage-config channel update "Gaming Deals" --name "PC Gaming"
bun run manage-config channel update "Gaming Deals" --webhook "https://discord.com/api/webhooks/new-url"

# Delete a channel (also removes all its search terms)
bun run manage-config channel delete "Gaming Deals"
```

### Search Term Management

```bash
# Add a search term to a channel
bun run manage-config add "Gaming Deals" steam-deck

# Add multiple search terms
bun run manage-config add-multiple "Gaming Deals" steam-deck ps5 xbox

# Add in disabled state
bun run manage-config add "Gaming Deals" nintendo --disabled

# List all configurations
bun run manage-config list

# List grouped by channel
bun run manage-config list-grouped

# Remove a search term from a channel
bun run manage-config remove "Gaming Deals" steam-deck

# Toggle enable/disable
bun run manage-config toggle "Gaming Deals" steam-deck
```

### Filtering System

Filter deals to get more relevant results.

```bash
# Exclude deals containing specific keywords
bun run manage-config add-filter "Gaming Deals" steam --exclude "washing,iron,kettle"

# Only include deals containing ALL specified keywords
bun run manage-config add-filter "Gaming Deals" laptop --include "gaming,rtx"

# Combine include and exclude filters
bun run manage-config add-filter "Gaming Deals" phone --exclude "case,screen protector" --include "iphone"

# Enable case-sensitive filtering
bun run manage-config add-filter "Gaming Deals" steam --exclude "keywords" --case-sensitive

# Remove specific filters
bun run manage-config remove-filter "Gaming Deals" steam --exclude "washing,iron"
```

## Common Usage Examples

### 1. Gaming Setup
```bash
# Create a gaming channel
bun run manage-config channel create "Gaming Deals" "$DISCORD_WEBHOOK"

# Add gaming-related search terms
bun run manage-config add-multiple "Gaming Deals" steam-deck ps5 xbox nintendo-switch

# Filter out non-gaming steam results
bun run manage-config add-filter "Gaming Deals" steam --exclude "washing,iron,kettle,boiler"
```

### 2. Tech Deals Setup
```bash
# Create a tech channel
bun run manage-config channel create "Tech Deals" "$TECH_WEBHOOK"

# Monitor various tech categories
bun run manage-config add-multiple "Tech Deals" laptop phone tablet headphones

# Filter laptop deals to exclude refurbished items
bun run manage-config add-filter "Tech Deals" laptop --exclude "refurbished,used,second hand"
```

### 3. Multiple Discord Channels
```bash
# Gaming channel
bun run manage-config channel create "Gaming" "$GAMING_WEBHOOK"
bun run manage-config add-multiple "Gaming" steam-deck ps5 xbox nintendo

# Tech channel
bun run manage-config channel create "Tech" "$TECH_WEBHOOK"
bun run manage-config add-multiple "Tech" laptop phone tablet

# Home appliances channel
bun run manage-config channel create "Home" "$HOME_WEBHOOK"
bun run manage-config add-multiple "Home" washing-machine dishwasher
```

### 4. View Your Setup
```bash
# See all channels
bun run manage-config channel list

# See all configurations grouped by channel
bun run manage-config list-grouped

# See individual configurations with filters
bun run manage-config list
```

## CLI Help

```bash
# Show all available commands
bun run manage-config --help

# Show usage examples
bun run manage-config examples

# Get help for a specific command
bun run manage-config channel --help
bun run manage-config add --help
```

## Feed Parser (Development)

For testing and development, you can use the feed parser directly:

```bash
# Search for deals by keyword
bun run feed-parser laptop
bun run feed-parser "gaming chair"
bun run feed-parser phone
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
  lastNotificationAt: z.string().optional(), // ISO timestamp of last notification sent
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Channel = z.infer<typeof Channel>;
```

### User Settings (AllowedUser)
```typescript
export const AllowedUser = z.object({
  discordId: z.string(),
  username: z.string().optional(),
  avatar: z.string().optional(),
  isAdmin: z.boolean().default(false),
  addedBy: z.string(),
  addedAt: z.string().optional(),
  // Quiet hours settings (account-level)
  quietHoursEnabled: z.boolean().default(false),
  quietHoursStart: z.string().optional(),    // HH:mm format (e.g., "22:00")
  quietHoursEnd: z.string().optional(),      // HH:mm format (e.g., "08:00")
  quietHoursTimezone: z.string().optional(), // IANA timezone (defaults to browser)
});

export type AllowedUser = z.infer<typeof AllowedUser>;
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
  fuzzyMatch: z.boolean().default(false), // When true, match any word; when false, match entire phrase
  maxPrice: z.number().optional(),     // Max price in pence (e.g., 5000 = £50.00)
  minDiscount: z.number().optional(),  // Min discount percentage (e.g., 30 = 30% off)
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type SearchTermConfig = z.infer<typeof SearchTermConfig>;
```

### Deal
```typescript
export const DealFilterStatus = z.enum([
  'passed',                  // Deal passed all filters, notification sent
  'filtered_no_match',       // Search term not found in deal title
  'filtered_exclude',        // Contains an excluded keyword
  'filtered_include',        // Missing required include keywords
  'filtered_price_too_high', // Price exceeds maximum threshold
  'filtered_discount_too_low', // Discount below minimum threshold
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
