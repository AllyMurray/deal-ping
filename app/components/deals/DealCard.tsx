import { useState, useMemo } from "react";
import { Group, Text, Badge, Anchor, Box, Collapse, UnstyledButton } from "@mantine/core";
import {
  IconExternalLink,
  IconClock,
  IconTag,
  IconBuildingStore,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconFilter,
  IconBell,
  IconBellOff,
} from "@tabler/icons-react";
import {
  deserializeMatchDetails,
  computeMatchDetailsForDisplay,
  formatMatchDetailsForUI,
  type MatchDetails,
} from "~/lib/match-details";

export type FilterStatus = 'passed' | 'filtered_no_match' | 'filtered_exclude' | 'filtered_include' | 'filtered_price_too_high' | 'filtered_discount_too_low';

export interface DealCardProps {
  id: string;
  title: string;
  link: string;
  price?: string;
  merchant?: string;
  searchTerm: string;
  timestamp?: number;
  matchDetails?: string; // Serialized JSON
  filterStatus?: FilterStatus;
  filterReason?: string;
  notified?: boolean; // Whether a notification was sent
}

// Helper to get filter status display info
function getFilterStatusInfo(filterStatus?: FilterStatus, filterReason?: string): {
  label: string;
  color: string;
  description: string;
} | null {
  if (!filterStatus || filterStatus === 'passed') {
    return null;
  }

  switch (filterStatus) {
    case 'filtered_no_match':
      return {
        label: 'No Match',
        color: 'gray',
        description: filterReason || 'Search term not found in deal',
      };
    case 'filtered_exclude':
      return {
        label: 'Excluded',
        color: 'red',
        description: filterReason || 'Contains excluded keyword',
      };
    case 'filtered_include':
      return {
        label: 'Missing Keywords',
        color: 'orange',
        description: filterReason || 'Required keywords not found',
      };
    case 'filtered_price_too_high':
      return {
        label: 'Price Too High',
        color: 'yellow',
        description: filterReason || 'Price exceeds maximum threshold',
      };
    case 'filtered_discount_too_low':
      return {
        label: 'Low Discount',
        color: 'yellow',
        description: filterReason || 'Discount below minimum threshold',
      };
    default:
      return null;
  }
}

export function DealCard({
  id,
  title,
  link,
  price,
  merchant,
  searchTerm,
  timestamp,
  matchDetails: matchDetailsSerialized,
  filterStatus,
  filterReason,
  notified,
}: DealCardProps) {
  const [showMatchDetails, setShowMatchDetails] = useState(false);

  const formattedDate = timestamp
    ? new Date(timestamp).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // Get or compute match details
  const matchInfo = useMemo(() => {
    // Try to deserialize stored match details
    const stored = deserializeMatchDetails(matchDetailsSerialized);
    if (stored) {
      return formatMatchDetailsForUI(stored);
    }
    // Compute match details for old records
    const computed = computeMatchDetailsForDisplay(title, merchant, searchTerm);
    return formatMatchDetailsForUI(computed);
  }, [matchDetailsSerialized, title, merchant, searchTerm]);

  // Get filter status display info
  const filterInfo = getFilterStatusInfo(filterStatus, filterReason);
  const isFiltered = filterStatus && filterStatus !== 'passed';

  return (
    <Box
      className="deal-card"
      data-testid={`deal-card-${id}`}
      style={{
        opacity: isFiltered ? 0.6 : 1,
        position: 'relative',
      }}
    >
      {/* Header with Title and Price */}
      <Group justify="space-between" align="flex-start" gap="md" mb="sm">
        <Anchor
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="deal-title"
          lineClamp={2}
          style={{ flex: 1 }}
          data-testid="deal-title"
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

        {price && (
          <Box className="badge-price" data-testid="deal-price">
            {price}
          </Box>
        )}
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

        {filterInfo && (
          <Badge
            variant="filled"
            size="sm"
            color={filterInfo.color}
            leftSection={<IconFilter size={12} stroke={1.5} />}
            data-testid="filter-status-badge"
            title={filterInfo.description}
          >
            {filterInfo.label}
          </Badge>
        )}

        {/* Notification status badge */}
        {notified !== undefined && (
          <Badge
            variant={notified ? "light" : "outline"}
            size="sm"
            color={notified ? "green" : "gray"}
            leftSection={notified ? <IconBell size={12} stroke={1.5} /> : <IconBellOff size={12} stroke={1.5} />}
            data-testid="notification-status-badge"
            title={notified ? "Notification sent" : filterReason || "No notification sent"}
          >
            {notified ? "Notified" : "Not Notified"}
          </Badge>
        )}
      </Group>

      {/* Match Details Toggle */}
      <UnstyledButton
        onClick={() => setShowMatchDetails(!showMatchDetails)}
        style={{ width: "100%" }}
        data-testid="match-details-toggle"
      >
        <Group gap={6} mb={showMatchDetails ? "xs" : 0}>
          <IconSearch size={14} stroke={1.5} style={{ color: "var(--text-muted)" }} />
          <Text size="xs" c="dimmed">
            Why did this match?
          </Text>
          {showMatchDetails ? (
            <IconChevronUp size={14} style={{ color: "var(--text-muted)" }} />
          ) : (
            <IconChevronDown size={14} style={{ color: "var(--text-muted)" }} />
          )}
        </Group>
      </UnstyledButton>

      {/* Match Details Content */}
      <Collapse in={showMatchDetails}>
        <Box
          style={{
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "var(--mantine-radius-sm)",
            padding: "var(--mantine-spacing-sm)",
            marginBottom: "var(--mantine-spacing-sm)",
          }}
          data-testid="match-details-content"
        >
          {/* Summary */}
          <Text size="sm" fw={500} mb="xs">
            {matchInfo.summary}
          </Text>

          {/* Matched Segments */}
          {matchInfo.segments.length > 0 && (
            <Box mb="xs">
              <Text size="xs" c="dimmed" mb={4}>
                Matched text:
              </Text>
              {matchInfo.segments.map((segment, index) => (
                <Text
                  key={index}
                  size="xs"
                  style={{ fontFamily: "monospace" }}
                  c="dimmed"
                >
                  {segment.text} <Text span size="xs" c="dimmed">({segment.location})</Text>
                </Text>
              ))}
            </Box>
          )}

          {/* Filter Info */}
          <Text size="xs" c="dimmed">
            {matchInfo.filterInfo}
          </Text>
        </Box>
      </Collapse>

      {/* Timestamp */}
      {formattedDate && (
        <Group gap={6}>
          <IconClock size={14} stroke={1.5} style={{ color: "var(--text-muted)" }} />
          <Text size="xs" c="dimmed" data-testid="deal-timestamp">
            {formattedDate}
          </Text>
        </Group>
      )}
    </Box>
  );
}
