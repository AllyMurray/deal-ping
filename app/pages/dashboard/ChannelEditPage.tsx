import { Title, Text, Stack, Paper, Anchor, Group } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { Link } from "react-router";
import { ChannelForm } from "~/components/channels";

export interface ChannelEditPageProps {
  channel: {
    id: string;
    name: string;
    webhookUrl: string;
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
          }}
          onCancel={onCancel}
          submitLabel="Save Changes"
        />
      </Paper>
    </Stack>
  );
}
