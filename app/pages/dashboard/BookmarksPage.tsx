import { Title, Text, Stack, TextInput, Group } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { EmptyState } from "~/components/ui";

export interface BookmarkCardProps {
  id: string;
  dealId: string;
  title: string;
  link: string;
  price?: string;
  merchant?: string;
  searchTerm: string;
  bookmarkedAt?: number;
}

export interface BookmarksPageProps {
  bookmarks: BookmarkCardProps[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onRemoveBookmark?: (dealId: string) => void;
  removeLoadingId?: string;
}

export function BookmarksPage({
  bookmarks,
  searchQuery,
  onSearchQueryChange,
  onRemoveBookmark,
  removeLoadingId,
}: BookmarksPageProps) {
  // Filter bookmarks client-side for search query
  const filteredBookmarks = bookmarks.filter((bookmark) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.merchant?.toLowerCase().includes(query) ||
        bookmark.searchTerm.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <Stack gap="lg" data-testid="bookmarks-page">
      <div>
        <Title order={2} data-testid="page-title">
          Bookmarks
        </Title>
        <Text c="dimmed">
          Your saved deals for later reference ({bookmarks.length} bookmarked)
        </Text>
      </div>

      <Group>
        <TextInput
          placeholder="Search bookmarks..."
          leftSection={<IconSearch size={16} stroke={1.5} />}
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.currentTarget.value)}
          style={{ flex: 1, maxWidth: 300 }}
          data-testid="search-input"
        />
      </Group>

      {filteredBookmarks.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No matching bookmarks" : "No bookmarks yet"}
          description={
            searchQuery
              ? "Try adjusting your search to find bookmarks."
              : "Bookmark deals from the Deal History page to save them here for later."
          }
        />
      ) : (
        <Stack gap="md" data-testid="bookmarks-list">
          {filteredBookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              {...bookmark}
              onRemove={onRemoveBookmark}
              removeLoading={removeLoadingId === bookmark.dealId}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

// Inline bookmark card component (simpler than DealCard)
import { Anchor, Box, Badge, ActionIcon, Tooltip } from "@mantine/core";
import {
  IconExternalLink,
  IconClock,
  IconTag,
  IconBuildingStore,
  IconBookmarkOff,
} from "@tabler/icons-react";

interface BookmarkCardInternalProps extends BookmarkCardProps {
  onRemove?: (dealId: string) => void;
  removeLoading?: boolean;
}

function BookmarkCard({
  dealId,
  title,
  link,
  price,
  merchant,
  searchTerm,
  bookmarkedAt,
  onRemove,
  removeLoading,
}: BookmarkCardInternalProps) {
  const formattedDate = bookmarkedAt
    ? new Date(bookmarkedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Box className="deal-card" data-testid={`bookmark-card-${dealId}`}>
      {/* Header with Title, Price, and Remove Button */}
      <Group justify="space-between" align="flex-start" gap="md" mb="sm">
        <Anchor
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="deal-title"
          lineClamp={2}
          style={{ flex: 1 }}
          data-testid="bookmark-title"
        >
          {title}
          <IconExternalLink
            size={14}
            style={{
              marginLeft: 6,
              verticalAlign: "middle",
              opacity: 0.5,
            }}
          />
        </Anchor>

        <Group gap="xs" wrap="nowrap">
          {price && (
            <Box className="badge-price" data-testid="bookmark-price">
              {price}
            </Box>
          )}

          {onRemove && (
            <Tooltip label="Remove bookmark">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="md"
                radius="md"
                onClick={() => onRemove(dealId)}
                loading={removeLoading}
                data-testid="remove-bookmark-button"
                aria-label="Remove bookmark"
              >
                <IconBookmarkOff size={18} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      {/* Tags Row */}
      <Group gap="xs" mb="sm">
        <Badge
          variant="light"
          size="sm"
          leftSection={<IconTag size={12} stroke={1.5} />}
          data-testid="search-term-badge"
        >
          {searchTerm}
        </Badge>

        {merchant && (
          <Badge
            variant="outline"
            size="sm"
            leftSection={<IconBuildingStore size={12} stroke={1.5} />}
            data-testid="merchant-badge"
            style={{
              borderColor: "var(--card-border)",
            }}
          >
            {merchant}
          </Badge>
        )}
      </Group>

      {/* Bookmarked Timestamp */}
      {formattedDate && (
        <Group gap={6}>
          <IconClock size={14} stroke={1.5} style={{ color: "var(--text-muted)" }} />
          <Text size="xs" c="dimmed" data-testid="bookmark-timestamp">
            Bookmarked {formattedDate}
          </Text>
        </Group>
      )}
    </Box>
  );
}
