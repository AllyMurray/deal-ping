import { Title, Text, Stack, Paper, Anchor, Group } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { Link } from "react-router";
import { ChannelForm } from "~/components/channels";

export interface ChannelEditPageProps {
  channel: {
    id: string;
    name: string;
    webhookUrl: string;
    quietHoursEnabled?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    quietHoursTimezone?: string;
  };
  onCancel: () => void;
}

export function ChannelEditPage({
  channel,
  onCancel,
}: ChannelEditPageProps) {
  return (
    <Stack gap="lg" data-testid="channel-edit-page">
      <Anchor component={Link} to={`/dashboard/channels/${channel.id}`} c="dimmed" size="sm">
        <Group gap="xs">
          <IconArrowLeft size={16} />
          Back to Channel
        </Group>
      </Anchor>

      <div>
        <Title order={2} data-testid="page-title">
          Edit Channel
        </Title>
        <Text c="dimmed">Update channel settings for {channel.name}</Text>
      </div>

      <Paper withBorder p="lg" maw={500}>
        <ChannelForm
          initialValues={{
            name: channel.name,
            webhookUrl: channel.webhookUrl,
            quietHoursEnabled: channel.quietHoursEnabled ?? false,
            quietHoursStart: channel.quietHoursStart ?? "22:00",
            quietHoursEnd: channel.quietHoursEnd ?? "08:00",
            quietHoursTimezone: channel.quietHoursTimezone ?? "Europe/London",
          }}
          onCancel={onCancel}
          submitLabel="Save Changes"
        />
      </Paper>
    </Stack>
  );
}
