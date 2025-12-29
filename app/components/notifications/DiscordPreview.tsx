import { Box, Text, Group, Paper, Stack, Anchor } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";

export interface DiscordPreviewProps {
  searchTerm: string;
  maxPrice?: number | null;
  minDiscount?: number | null;
}

// Sample deal data for preview
const getSampleDeal = (searchTerm: string) => ({
  title: `Amazing ${searchTerm.replace(/-/g, " ")} Deal - Limited Time Offer`,
  link: "https://www.hotukdeals.com/deals/example",
  price: "£49.99",
  originalPrice: "£79.99",
  savings: "£30.00",
  savingsPercentage: 38,
  merchant: "Amazon UK",
});

// Color palette matching notifier.ts getDealColor()
const EMBED_COLOR = "#4caf50"; // Green

export function DiscordPreview({
  searchTerm,
  maxPrice,
  minDiscount,
}: DiscordPreviewProps) {
  const deal = getSampleDeal(searchTerm || "your-search-term");

  // Format price display with savings
  const formatPriceField = (): string => {
    let priceText = `💰 **${deal.price}**`;
    priceText += ` ~~${deal.originalPrice}~~`;
    priceText += ` (Save ${deal.savings} - ${deal.savingsPercentage}% off)`;
    return priceText;
  };

  // Build "Why Matched" field based on config
  const formatWhyMatched = (): string => {
    const parts: string[] = [];
    parts.push(`Search term "${searchTerm || "example"}" found in title`);
    return `🔍 ${parts.join(". ")}`;
  };

  // Build lock screen content preview
  const lockScreenContent = (): string => {
    return `🆕 **${searchTerm || "your-search-term"}**\n💰 ${deal.price}  •  🏪 ${deal.merchant}\n> ${deal.title}`;
  };

  return (
    <Stack gap="md">
      {/* Lock screen preview */}
      <Box>
        <Text size="xs" c="dimmed" mb="xs" fw={500}>
          Lock Screen Preview
        </Text>
        <Paper
          p="md"
          radius="md"
          style={{
            backgroundColor: "#36393f",
            border: "1px solid #40444b",
          }}
        >
          <Text
            size="sm"
            style={{
              color: "#dcddde",
              fontFamily:
                'gg sans, "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
              whiteSpace: "pre-wrap",
            }}
          >
            {lockScreenContent().split("\n").map((line, i) => (
              <span key={i}>
                {line.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                      <Text key={j} span fw={700} style={{ color: "#ffffff" }}>
                        {part.slice(2, -2)}
                      </Text>
                    );
                  }
                  return part;
                })}
                {i < lockScreenContent().split("\n").length - 1 && <br />}
              </span>
            ))}
          </Text>
        </Paper>
      </Box>

      {/* Discord Embed Preview */}
      <Box>
        <Text size="xs" c="dimmed" mb="xs" fw={500}>
          Discord Embed Preview
        </Text>
        <Paper
          p="sm"
          radius="md"
          style={{
            backgroundColor: "#2f3136",
            border: "1px solid #40444b",
          }}
        >
          <Box
            style={{
              borderLeft: `4px solid ${EMBED_COLOR}`,
              paddingLeft: "12px",
            }}
          >
            {/* Title */}
            <Anchor
              href="#"
              target="_blank"
              style={{
                color: "#00aff4",
                fontWeight: 600,
                fontSize: "14px",
                textDecoration: "none",
              }}
              data-testid="embed-title"
            >
              {deal.title}
              <IconExternalLink
                size={12}
                style={{
                  marginLeft: 4,
                  verticalAlign: "middle",
                  opacity: 0.7,
                }}
              />
            </Anchor>

            {/* Fields */}
            <Group gap="xl" mt="sm">
              {/* Price Field */}
              <Box>
                <Text
                  size="xs"
                  fw={600}
                  style={{ color: "#b9bbbe" }}
                  mb={2}
                >
                  Price
                </Text>
                <Text
                  size="sm"
                  style={{
                    color: "#dcddde",
                    fontFamily:
                      'gg sans, "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
                  }}
                >
                  {formatPriceField().split(/(\*\*[^*]+\*\*|~~[^~]+~~)/).map((part, i) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return (
                        <Text key={i} span fw={700} style={{ color: "#ffffff" }}>
                          {part.slice(2, -2)}
                        </Text>
                      );
                    }
                    if (part.startsWith("~~") && part.endsWith("~~")) {
                      return (
                        <Text
                          key={i}
                          span
                          td="line-through"
                          style={{ color: "#72767d" }}
                        >
                          {part.slice(2, -2)}
                        </Text>
                      );
                    }
                    return part;
                  })}
                </Text>
              </Box>

              {/* Merchant Field */}
              <Box>
                <Text
                  size="xs"
                  fw={600}
                  style={{ color: "#b9bbbe" }}
                  mb={2}
                >
                  Merchant
                </Text>
                <Text size="sm" style={{ color: "#dcddde" }}>
                  🏪 {deal.merchant}
                </Text>
              </Box>
            </Group>

            {/* Why Matched Field */}
            <Box mt="sm">
              <Text
                size="xs"
                fw={600}
                style={{ color: "#b9bbbe" }}
                mb={2}
              >
                Why Matched
              </Text>
              <Text size="sm" style={{ color: "#dcddde" }}>
                {formatWhyMatched()}
              </Text>
            </Box>

            {/* Footer */}
            <Group gap="xs" mt="sm">
              <Text size="xs" style={{ color: "#72767d" }}>
                Search Term: {searchTerm || "your-search-term"}
              </Text>
              <Text size="xs" style={{ color: "#72767d" }}>
                •
              </Text>
              <Text size="xs" style={{ color: "#72767d" }}>
                Today at {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </Group>
          </Box>
        </Paper>
      </Box>

      {/* Filter Info */}
      {(maxPrice || minDiscount) && (
        <Box>
          <Text size="xs" c="dimmed" mb="xs" fw={500}>
            Active Filters
          </Text>
          <Paper p="sm" withBorder>
            <Stack gap="xs">
              {maxPrice && (
                <Text size="sm" c="dimmed">
                  • Only deals under <Text span fw={600}>£{maxPrice.toFixed(2)}</Text> will trigger notifications
                </Text>
              )}
              {minDiscount && (
                <Text size="sm" c="dimmed">
                  • Only deals with at least <Text span fw={600}>{minDiscount}% discount</Text> will trigger notifications
                </Text>
              )}
            </Stack>
          </Paper>
        </Box>
      )}
    </Stack>
  );
}
