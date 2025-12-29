import {
  Title,
  Text,
  Stack,
  Table,
  Badge,
  Group,
  Anchor,
  ActionIcon,
  Tooltip,
  Box,
} from "@mantine/core";
import {
  IconExternalLink,
  IconCheck,
  IconX,
  IconCurrencyPound,
  IconPercentage,
} from "@tabler/icons-react";
import { Link } from "react-router";
import { EmptyState } from "~/components/ui";

export interface SearchTermWithChannel {
  searchTerm: string;
  channelId: string;
  channelName: string;
  enabled: boolean;
  includeKeywords: string[];
  excludeKeywords: string[];
  maxPrice?: number;
  minDiscount?: number;
}

export interface SearchTermsPageProps {
  searchTerms: SearchTermWithChannel[];
}

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function SearchTermsPage({ searchTerms }: SearchTermsPageProps) {
  const enabledCount = searchTerms.filter((t) => t.enabled).length;
  const uniqueChannels = new Set(searchTerms.map((t) => t.channelId)).size;

  return (
    <Stack gap="lg" data-testid="search-terms-page">
      <div>
        <Title order={2} data-testid="page-title">
          Search Terms
        </Title>
        <Text c="dimmed">
          All search terms across your channels ({enabledCount} active across{" "}
          {uniqueChannels} {uniqueChannels === 1 ? "channel" : "channels"})
        </Text>
      </div>

      {searchTerms.length === 0 ? (
        <EmptyState
          title="No search terms yet"
          description="Add search terms to your channels to start receiving deal notifications."
          actionLabel="View Channels"
          actionHref="/dashboard/channels"
        />
      ) : (
        <Box className="card-glass" style={{ borderRadius: 12, overflow: "hidden" }}>
          <Table striped highlightOnHover data-testid="search-terms-table">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Search Term</Table.Th>
                <Table.Th>Channel</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Filters</Table.Th>
                <Table.Th w={50}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {searchTerms.map((term) => (
                <Table.Tr
                  key={`${term.channelId}-${term.searchTerm}`}
                  data-testid={`search-term-row-${term.searchTerm}`}
                >
                  <Table.Td>
                    <Text fw={500}>{term.searchTerm}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Anchor
                      component={Link}
                      to={`/dashboard/channels/${term.channelId}`}
                      size="sm"
                    >
                      {term.channelName}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={term.enabled ? "green" : "gray"}
                      variant="light"
                      leftSection={
                        term.enabled ? (
                          <IconCheck size={12} />
                        ) : (
                          <IconX size={12} />
                        )
                      }
                    >
                      {term.enabled ? "Active" : "Paused"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {term.includeKeywords.length > 0 && (
                        <Tooltip
                          label={`Include: ${term.includeKeywords.join(", ")}`}
                          withArrow
                        >
                          <Badge size="sm" variant="dot" color="green">
                            +{term.includeKeywords.length} include
                          </Badge>
                        </Tooltip>
                      )}
                      {term.excludeKeywords.length > 0 && (
                        <Tooltip
                          label={`Exclude: ${term.excludeKeywords.join(", ")}`}
                          withArrow
                        >
                          <Badge size="sm" variant="dot" color="red">
                            -{term.excludeKeywords.length} exclude
                          </Badge>
                        </Tooltip>
                      )}
                      {term.maxPrice !== undefined && (
                        <Tooltip
                          label={`Max price: ${formatPrice(term.maxPrice)}`}
                          withArrow
                        >
                          <Badge
                            size="sm"
                            variant="light"
                            color="blue"
                            leftSection={<IconCurrencyPound size={10} />}
                          >
                            {formatPrice(term.maxPrice)}
                          </Badge>
                        </Tooltip>
                      )}
                      {term.minDiscount !== undefined && (
                        <Tooltip
                          label={`Min discount: ${term.minDiscount}%`}
                          withArrow
                        >
                          <Badge
                            size="sm"
                            variant="light"
                            color="orange"
                            leftSection={<IconPercentage size={10} />}
                          >
                            {term.minDiscount}%+
                          </Badge>
                        </Tooltip>
                      )}
                      {term.includeKeywords.length === 0 &&
                        term.excludeKeywords.length === 0 &&
                        term.maxPrice === undefined &&
                        term.minDiscount === undefined && (
                          <Text size="xs" c="dimmed">
                            No filters
                          </Text>
                        )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Tooltip label="View channel" withArrow>
                      <ActionIcon
                        component={Link}
                        to={`/dashboard/channels/${term.channelId}`}
                        variant="subtle"
                        color="gray"
                        size="sm"
                      >
                        <IconExternalLink size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      )}
    </Stack>
  );
}
