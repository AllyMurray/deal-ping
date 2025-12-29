import {
  Title,
  Text,
  SimpleGrid,
  Stack,
  Group,
  Box,
  Badge,
  Button,
  Tooltip,
} from "@mantine/core";
import {
  IconWebhook,
  IconSearch,
  IconHistory,
  IconPlus,
  IconArrowRight,
  IconClock,
} from "@tabler/icons-react";
import { Link } from "react-router";

export interface DashboardStats {
  channelCount: number;
  configCount: number;
  enabledConfigCount: number;
  dealsToday: number;
}

export interface DashboardHomePageProps {
  stats: DashboardStats;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  suffix?: React.ReactNode;
  accentColor?: string;
  delay?: number;
  testId?: string;
  href?: string;
  tooltip?: string;
}

function StatCard({ icon, value, label, suffix, accentColor, delay = 0, testId, href, tooltip }: StatCardProps) {
  const cardContent = (
    <Box
      className={`stat-card card-glass ${href ? "stat-card-clickable" : ""}`}
      p="xl"
      data-testid={testId}
      style={{
        animation: `fadeInUp 0.5s ease-out ${delay}s forwards`,
        opacity: 0,
        borderRadius: 16,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Accent line at top */}
      <Box
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accentColor || "var(--gradient-flame)",
        }}
      />

      <Group justify="space-between" align="flex-start">
        <Stack gap="xs">
          <Group gap="sm" align="center">
            <Text className="stat-value">
              {value}
            </Text>
            {suffix}
          </Group>
          <Tooltip label={tooltip} disabled={!tooltip} position="bottom" withArrow>
            <Text className="stat-label" style={{ cursor: tooltip ? "help" : undefined }}>
              {label}
            </Text>
          </Tooltip>
        </Stack>

        <Box
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "rgba(255, 144, 37, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--flame-500)",
          }}
        >
          {icon}
        </Box>
      </Group>
    </Box>
  );

  if (href) {
    return (
      <Box
        component={Link}
        to={href}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        {cardContent}
      </Box>
    );
  }

  return cardContent;
}

export function DashboardHomePage({ stats }: DashboardHomePageProps) {
  const disabledCount = stats.configCount - stats.enabledConfigCount;

  return (
    <Stack gap="xl" data-testid="dashboard-home-page">
      {/* Header */}
      <Box
        style={{
          animation: "fadeInUp 0.5s ease-out forwards",
        }}
      >
        <Title order={2} mb={4} data-testid="page-title">
          Command Centre
        </Title>
        <Text c="dimmed" size="lg">
          Your deal hunting headquarters. Monitor and manage your notification setup.
        </Text>
      </Box>

      {/* Stats Grid */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
        <StatCard
          icon={<IconWebhook size={24} stroke={1.5} />}
          value={stats.channelCount}
          label="Discord Channels"
          tooltip="Discord webhooks configured to receive deal notifications"
          href="/dashboard/channels"
          delay={0.1}
          testId="stat-channels"
        />

        <StatCard
          icon={<IconSearch size={24} stroke={1.5} />}
          value={stats.configCount}
          label="Search Terms"
          tooltip="Keywords being monitored for deals across all channels"
          href="/dashboard/search-terms"
          suffix={
            stats.configCount > 0 ? (
              <Badge
                size="sm"
                variant="light"
                color={disabledCount > 0 ? "yellow" : "green"}
              >
                {disabledCount > 0
                  ? `${stats.enabledConfigCount} active`
                  : "all active"}
              </Badge>
            ) : null
          }
          delay={0.15}
          testId="stat-search-terms"
        />

        <StatCard
          icon={<IconClock size={24} stroke={1.5} />}
          value={stats.dealsToday}
          label="Deals Today"
          tooltip="Number of deals found today across all your search terms"
          href="/dashboard/deals?dateRange=today"
          delay={0.2}
          testId="stat-deals-today"
        />
      </SimpleGrid>

      {/* Quick Actions - only show when user has channels */}
      {stats.channelCount > 0 && (
        <Box
          style={{
            animation: "fadeInUp 0.5s ease-out 0.25s forwards",
            opacity: 0,
          }}
        >
          <Text size="sm" fw={600} c="dimmed" tt="uppercase" mb="md" style={{ letterSpacing: "0.06em" }}>
            Quick Actions
          </Text>

          <Group gap="md">
            <Button
              component={Link}
              to="/dashboard/channels/new"
              variant="light"
              leftSection={<IconPlus size={18} />}
              radius="md"
            >
              Add Channel
            </Button>

            <Button
              component={Link}
              to="/dashboard/channels"
              variant="subtle"
              rightSection={<IconArrowRight size={16} />}
              radius="md"
            >
              View All Channels
            </Button>

            <Button
              component={Link}
              to="/dashboard/deals"
              variant="subtle"
              rightSection={<IconArrowRight size={16} />}
              radius="md"
            >
              View Deal History
            </Button>
          </Group>
        </Box>
      )}

      {/* Getting Started Hint (show only if no channels) */}
      {stats.channelCount === 0 && (
        <Box
          className="empty-state"
          style={{
            animation: "fadeInUp 0.5s ease-out 0.3s forwards",
            opacity: 0,
          }}
        >
          <Box className="empty-state-icon">
            <IconWebhook size={32} stroke={1.5} />
          </Box>
          <Title order={3} mb={8}>
            Ready to start hunting?
          </Title>
          <Text c="dimmed" mb="lg" maw={400} mx="auto">
            Create your first Discord channel to begin receiving deal notifications.
            You'll need a Discord webhook URL.
          </Text>
          <Button
            component={Link}
            to="/dashboard/channels/new"
            size="lg"
            radius="xl"
            className="btn-flame"
            leftSection={<IconPlus size={20} />}
          >
            Create Your First Channel
          </Button>
        </Box>
      )}
    </Stack>
  );
}
