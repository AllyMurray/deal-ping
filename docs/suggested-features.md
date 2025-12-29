# Suggested Features & UX Improvements

This document outlines potential features and UX improvements identified during a comprehensive review of the DealPing application.

## UX Issues to Address

| Issue | Location | Impact | Priority |
|-------|----------|--------|----------|
| **"Deals Today" shows "Soon"** | Dashboard Home | Incomplete placeholder looks unfinished - should show actual data or be hidden | Medium |
| **No sorting on Deals page** | DealsPage | Users can filter but can't sort by date, price, or search term | High |
| **No date range filter** | DealFilters | Users can't filter deals by time period (today, this week, etc.) | High |
| **Search terms link to channels** | DashboardHomePage | Both stat cards link to `/dashboard/channels` - not intuitive for search terms | Low |
| **No webhook validation** | ChannelForm | No live check if webhook URL is valid before saving | Medium |
| **Channel has no activity indicator** | ChannelCard | No "last notification" timestamp to show if channel is active | Medium |

## Missing Features

### High Value - Low Effort

#### 1. Date Range Filter on Deals Page
Add a dropdown to filter deals by time period.

**Options:**
- Today
- Last 7 days
- Last 30 days
- All time

**Implementation:**
- Add filter dropdown to `DealFilters` component
- Filter deals by `timestamp` field in loader

#### 2. Sorting Options on Deals Page
Allow sorting deals by different criteria.

**Sort by:**
- Date (newest/oldest)
- Price (low/high)
- Search term (alphabetical)

**Implementation:**
- Add sort dropdown to `DealFilters` component
- Sort in loader or client-side depending on data size

#### 3. Last Notification Timestamp on Channel Cards
Show when the last deal was sent for each channel.

**Display:**
- "Last notification: 2 hours ago"
- "No notifications yet"

**Implementation:**
- Track `lastNotificationAt` on Channel entity
- Update when notification is sent in notifier

### High Value - Medium Effort

#### 4. Price Threshold Alerts
Only notify when deal price is under a specified amount.

**Configuration:**
- Per search term: "Only notify if price < £50"
- Support percentage discounts: "Only notify if > 30% off"

**Implementation:**
- Add `maxPrice` and `minDiscount` fields to SearchTermConfig
- Filter deals in notifier based on price parsing

#### 5. Notification Preview
Show what the Discord message will look like before saving.

**Features:**
- Live preview of Discord embed
- Shows how filters will affect notifications

**Implementation:**
- Create Discord embed preview component
- Render sample deal with current config

#### 6. Duplicate Search Term Detection
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

## Implementation Priority

### Phase 1 (Quick Wins)
1. Date range filter
2. Sorting options
3. Last notification timestamp

### Phase 2 (User Experience)
4. Price threshold alerts
5. Notification preview
6. Duplicate detection

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
