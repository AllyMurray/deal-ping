# Suggested Features & UX Improvements

This document outlines potential features and UX improvements identified during a comprehensive review of the DealPing application.

## UX Issues to Address

| Issue | Location | Impact | Priority |
|-------|----------|--------|----------|
| ~~**"Deals Today" shows "Soon"**~~ | ~~Dashboard Home~~ | ~~Incomplete placeholder looks unfinished - should show actual data or be hidden~~ | ~~Medium~~ ✓ |
| ~~**No sorting on Deals page**~~ | ~~DealsPage~~ | ~~Users can filter but can't sort by date, price, or search term~~ | ~~High~~ (Not implementing - see notes) |
| ~~**No date range filter**~~ | ~~DealFilters~~ | ~~Users can't filter deals by time period (today, this week, etc.)~~ | ~~High~~ ✓ |
| ~~**Search terms link to channels**~~ | ~~DashboardHomePage~~ | ~~Both stat cards link to `/dashboard/channels` - not intuitive for search terms~~ | ~~Low~~ ✓ |
| ~~**No webhook validation**~~ | ~~ChannelForm~~ | ~~No live check if webhook URL is valid before saving~~ | ~~Medium~~ ✓ |
| ~~**Channel has no activity indicator**~~ | ~~ChannelCard~~ | ~~No "last notification" timestamp to show if channel is active~~ | ~~Medium~~ ✓ |

## Missing Features

### High Value - Low Effort

#### ~~1. Date Range Filter on Deals Page~~ (Implemented)
Add a dropdown to filter deals by time period.

**Options:**
- Today
- Last 7 days
- Last 30 days
- All time

**Implementation:**
- Add filter dropdown to `DealFilters` component
- Filter deals by `timestamp` field in loader

#### 2. Sorting Options on Deals Page (Not Implementing)
Allow sorting deals by different criteria.

**Sort by:**
- Date (newest/oldest) - Already default
- Price (low/high)
- Search term (alphabetical)

**Why not implementing:**
Sorting by price or search term would require either:
1. **Full table scans** - The DynamoDB design partitions deals by search term with timestamp in the sort key. There's no GSI for price or cross-search-term sorting.
2. **New GSIs** - Adding a price GSI is complex because prices are stored as strings ("£49.99", "Free", etc.) and would need normalization.
3. **Client-side sorting** - With pagination, this would be misleading. Users would see "cheapest deals" but only from the current page, not globally.

**Current behavior:**
- Deals are always sorted by date (newest first) which is the most useful default
- Users can filter by search term to focus on specific categories
- The existing date-based sorting uses the efficient `bySearchTerm` GSI

#### ~~3. Last Notification Timestamp on Channel Cards~~ (Implemented)
Show when the last deal was sent for each channel.

**Display:**
- "Last notification: 2 hours ago"
- "No notifications yet"

**Implementation:**
- Track `lastNotificationAt` on Channel entity
- Update when notification is sent in notifier

### High Value - Medium Effort

#### ~~4. Price Threshold Alerts~~ (Implemented)
Only notify when deal price is under a specified amount.

**Configuration:**
- Per search term: "Only notify if price < £50"
- Support percentage discounts: "Only notify if > 30% off"

**Implementation:**
- Add `maxPrice` and `minDiscount` fields to SearchTermConfig
- Filter deals in notifier based on price parsing

#### ~~5. Notification Preview~~ (Implemented)
Show what the Discord message will look like before saving.

**Features:**
- Live preview of Discord embed
- Shows how filters will affect notifications

**Implementation:**
- Create Discord embed preview component
- Render sample deal with current config

#### ~~6. Duplicate Search Term Detection~~ (Implemented)
Warn when adding search terms that exist in other channels.

**Behavior:**
- Show warning: "This search term is already used in 'Gaming Deals'"
- Allow proceeding but inform user

**Implementation:**
- Check existing configs in form validation
- Display warning in ConfigForm

### Nice to Have

#### 7. Onboarding Tutorial
Guide new users through setup process.

**Steps:**
1. How to create a Discord webhook
2. Setting up first channel
3. Adding search terms
4. Configuring filters

**Implementation:**
- Create guided tour component
- Show on first login or empty dashboard

#### 8. Deal Bookmarking
Save interesting deals for later reference.

**Features:**
- Star/bookmark individual deals
- View bookmarked deals page
- Remove bookmark

**Implementation:**
- Create BookmarkedDeal entity
- Add bookmark button to DealCard
- Create bookmarks page

#### 9. Export to CSV
Export deal history for analysis.

**Export options:**
- All deals
- Filtered view
- Date range

**Implementation:**
- Add export button to DealsPage
- Generate CSV on server or client

#### 10. Notification History
Track which notifications were actually sent.

**Features:**
- View sent notifications with timestamps
- See delivery status
- Retry failed notifications

**Implementation:**
- Create NotificationLog entity
- Log each Discord API call
- Display in dashboard

## Completed Features

### Price Threshold Alerts (Implemented)
Only notify when deal price is under a specified amount or discount meets minimum threshold.

**Configuration:**
- Per search term: Set maximum price (e.g., "Only notify if price < £50")
- Per search term: Set minimum discount percentage (e.g., "Only notify if > 30% off")
- Configure in the search term edit form

**Behavior:**
- Deals with price above maximum are filtered (filter status: `filtered_price_too_high`)
- Deals with discount below minimum are filtered (filter status: `filtered_discount_too_low`)
- Deal history page shows all deals with notification status and filter reasons
- Each deal card displays whether notification was sent and why/why not

### Quiet Hours (Implemented)
Account-level setting to pause notifications during specified hours. Deals are queued and sent when quiet hours end.

**Configuration:**
- Enable/disable in Settings page (applies to all channels)
- Set start and end time (24-hour format)
- Select timezone (auto-detects from browser on first setup)

**Behavior:**
- Deals found during quiet hours are stored in DynamoDB queue
- When quiet hours end, all queued deals are sent as a batch
- 24-hour TTL on queued deals for automatic cleanup
- Single setting applies to all channels (better UX than per-channel)

### Notification Preview (Implemented)
Show what the Discord message will look like before saving, helping users understand how their notifications will appear.

**Features:**
- Live preview of Discord embed with sample deal data
- Lock screen preview showing how notifications appear on mobile
- Displays active price and discount filters
- Collapsible section to keep the interface clean

**Location:**
- Available on the Channel Detail page (between Search Terms and Deals sections)
- Click "Notification Preview" to expand/collapse the preview

**Behavior:**
- Shows a realistic Discord embed using the first search term's configuration
- Displays sample deal title, price, merchant, and "Why Matched" information
- When price thresholds are configured, shows which filters are active
- Updates dynamically based on the channel's search term settings

### Duplicate Search Term Detection (Implemented)
Warn when adding search terms that already exist in other channels, helping users avoid unintentional duplicate notifications.

**Features:**
- Real-time duplicate detection as you type
- Shows which channels already use the same search term
- Non-blocking warning that allows you to proceed if desired

**Location:**
- Available in the Add Search Term form (ConfigForm modal)

**Behavior:**
- When typing a search term, the system checks if it's already used in your other channels
- If duplicates are found, shows a yellow warning: "This search term is already used in: [Channel Name]. You can still add it, but you may receive duplicate notifications."
- The warning is debounced (300ms) to avoid excessive API calls while typing
- Duplicate detection only runs when adding new search terms, not when editing existing ones
- Users can still proceed with adding the duplicate term if they choose to

### Last Notification Timestamp (Implemented)
Show when each channel last sent a notification, helping users see if their channels are active and receiving deals.

**Features:**
- Displays relative time since last notification (e.g., "2 hours ago", "3 days ago")
- Shows "No notifications yet" for channels that haven't sent any notifications
- Automatically updated each time a notification is successfully sent

**Location:**
- Displayed on each Channel Card in the Channels list page

**Behavior:**
- The `lastNotificationAt` timestamp is stored on the Channel entity in DynamoDB
- When a Discord notification is sent successfully (either immediately or after quiet hours end), the timestamp is updated
- The timestamp is displayed as relative time using a user-friendly format:
  - "just now" for notifications within the last minute
  - "X minutes ago" / "X hours ago" / "X days ago" / "X weeks ago" for recent notifications
  - Actual date (e.g., "15 Feb") for notifications more than a month old
  - Year included for notifications from previous years (e.g., "15 Jun 2023")

### Webhook Validation (Implemented)
Live validation of Discord webhook URLs before saving, ensuring webhooks are valid and active.

**Features:**
- "Test" button next to webhook URL input
- Validates webhook by calling the Discord API
- Shows webhook name on success to confirm correct webhook
- Shows specific error messages (not found, invalid, etc.)

**Location:**
- Available in the Channel Form (when creating or editing a channel)

**Behavior:**
- Click the "Test" button to validate the webhook URL
- The button is disabled until a webhook URL is entered
- On success: Shows green alert with "Webhook verified: [Webhook Name]"
- On error: Shows red alert with specific error message
- Validation is optional - users can still save without testing

**Technical Details:**
- Uses `useFetcher` hook to submit to the page's action with `intent: "validate"`
- Validation logic in `app/lib/webhook-validation.server.ts` (shared by new/edit routes)
- Makes a GET request to the Discord webhook URL from the server
- Discord returns webhook info (name, channel_id, etc.) for valid webhooks
- Returns appropriate error messages for 404 (deleted), 401 (invalid), and other errors

### Date Range Filter (Implemented)
Filter deal history by time period, with efficient database queries that avoid table scans.

**Features:**
- Dropdown filter with options: Today, Last 7 days, Last 30 days, All time
- Default filter is "Last 7 days" for fast initial page load
- Combines with existing search term filter

**Location:**
- Available in the Deal Filters bar on the Deals page

**Behavior:**
- Uses the existing `bySearchTerm` GSI with timestamp in the sort key for efficient queries
- Each search term is queried in parallel with the date range filter applied at the database level
- No table scans - queries only read matching data from the index
- Results are merged and sorted by date (newest first)

**Technical Details:**
- The `getDealsBySearchTerm` repository function accepts `startTime` and `endTime` parameters
- ElectroDB translates these to DynamoDB `KeyConditionExpression` using `between`, `gte`, or `lte` operators
- Query is performed on the sort key (`TS#${timestamp}`) of the `bySearchTerm` GSI
- Multiple search terms are queried in parallel using `Promise.all` for performance

### Search Terms Page (Implemented)
Dedicated page showing all search terms across all channels, fixing the UX issue where the Search Terms stat card linked to the Channels page.

**Features:**
- Consolidated view of all search terms across all channels
- Shows search term name, parent channel, status (active/paused), and filters
- Filter badges for include/exclude keywords, max price, and min discount
- Click-through links to parent channel detail page
- Navigation link in sidebar for easy access

**Location:**
- Available at `/dashboard/search-terms`
- Accessible via Search Terms stat card on dashboard home
- Added to sidebar navigation between Channels and Deal History

**Behavior:**
- Displays all search terms in a table format sorted alphabetically
- Shows count of active terms and unique channels in subtitle
- Each row links to the parent channel for easy navigation
- Filter badges use tooltips to show full filter details
- Empty state prompts users to view channels if no search terms exist

**Technical Details:**
- Route: `app/routes/dashboard/search-terms.tsx`
- Page component: `app/pages/dashboard/SearchTermsPage.tsx`
- Fetches all channels for the user, then all configs for each channel
- Combines data into a flat list with channel names included
- Uses existing repository functions (`getChannelsByUser`, `getConfigsByChannel`)

### Deals Today Stat Card (Implemented)
The "Deals Today" stat card on the dashboard home page now shows the actual count of deals found today instead of the placeholder "Soon" text.

**Features:**
- Shows real-time count of deals found today across all user's search terms
- Clicking the stat card navigates to the deals page with "Today" filter pre-selected
- Tooltip explains what the count represents

**Location:**
- Dashboard Home page stat cards

**Behavior:**
- Counts deals from all unique search terms configured by the user
- Uses the start of the current day (midnight) as the time boundary
- Queries are made in parallel for efficient loading
- Shows "0" when no deals have been found today

**Technical Details:**
- Route loader: `app/routes/dashboard/index.tsx`
- Page component: `app/pages/dashboard/DashboardHomePage.tsx`
- Uses `getDealsBySearchTerm` with `startTime` parameter for efficient GSI queries
- Deduplicates search terms to avoid querying the same term multiple times

## Implementation Priority

### Phase 1 (Quick Wins)
1. ~~Date range filter~~ ✓
2. ~~Sorting options~~ (Not implementing - see notes above)
3. ~~Last notification timestamp~~ ✓

### Phase 2 (User Experience)
4. ~~Price threshold alerts~~ ✓
5. ~~Notification preview~~ ✓
6. ~~Duplicate detection~~ ✓

### Phase 3 (Power Features)
7. Onboarding tutorial
8. Deal bookmarking
9. Export to CSV
10. Notification history

## Technical Considerations

### Performance
- Consider pagination for large deal lists
- Use DynamoDB GSIs efficiently for new queries
- Client-side sorting for small datasets, server-side for large

### Storage
- New entities may need additional DynamoDB capacity
- Consider TTL for transient data (bookmarks older than X months)

### UI/UX
- Maintain consistent design language
- Use existing Mantine components
- Follow established patterns in codebase
