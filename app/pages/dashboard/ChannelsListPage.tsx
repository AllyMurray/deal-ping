import {
  Title,
  Text,
  Stack,
  Button,
  Group,
  SimpleGrid,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { Link } from "react-router";
import { ChannelCard } from "~/components/channels";
import { EmptyState } from "~/components/ui";

export interface ChannelWithStats {
  id: string;
  name: string;
  webhookUrl: string;
  configCount: number;
  enabledConfigCount: number;
  lastNotificationAt?: string;
}

export interface ChannelsListPageProps {
  channels: ChannelWithStats[];
  onEditChannel: (id: string) => void;
  onDeleteChannel: (id: string) => void;
}

export function ChannelsListPage({
  channels,
  onEditChannel,
  onDeleteChannel,
}: ChannelsListPageProps) {
  return (
    <Stack gap="lg" data-testid="channels-list-page">
      <Group justify="space-between">
        <div>
          <Title order={2} data-testid="page-title">
            Channels
          </Title>
          <Text c="dimmed">Manage your Discord webhook channels</Text>
        </div>
        <Button
          component={Link}
          to="/dashboard/channels/new"
          leftSection={<IconPlus size={18} />}
          data-testid="add-channel-button"
        >
          Add Channel
        </Button>
      </Group>

      {channels.length === 0 ? (
        <EmptyState
          title="No channels yet"
          description="Create your first Discord webhook channel to start receiving deal notifications."
          actionLabel="Add Channel"
          actionHref="/dashboard/channels/new"
        />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" data-testid="channels-grid">
          {channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              id={channel.id}
              name={channel.name}
              webhookUrl={channel.webhookUrl}
              configCount={channel.configCount}
              enabledConfigCount={channel.enabledConfigCount}
              lastNotificationAt={channel.lastNotificationAt}
              onEdit={() => onEditChannel(channel.id)}
              onDelete={() => onDeleteChannel(channel.id)}
            />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
