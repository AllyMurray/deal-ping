import { useState, useEffect } from "react";
import { useNavigate, useFetcher } from "react-router";
import type { Route } from "./+types/index";
import { ChannelsListPage, type ChannelWithStats } from "~/pages/dashboard";
import { DeleteChannelModal } from "~/components/channels";
import { RouteErrorBoundary } from "~/components/ui";
import { requireUser } from "~/lib/auth";
import {
  getChannelsByUser,
  getChannel,
  getConfigsByChannel,
  deleteChannel,
} from "~/db/repository.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireUser(request);
  const channels = await getChannelsByUser({ userId: user.id });

  // Get config counts for each channel
  const channelsWithStats: ChannelWithStats[] = await Promise.all(
    channels.map(async (channel) => {
      const configs = await getConfigsByChannel({ channelId: channel.channelId });
      return {
        id: channel.channelId,
        name: channel.name,
        webhookUrl: channel.webhookUrl,
        configCount: configs.length,
        enabledConfigCount: configs.filter((c) => c.enabled).length,
      };
    })
  );

  return { channels: channelsWithStats };
}

export async function action({ request }: Route.ActionArgs) {
  const { user } = await requireUser(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const channelId = formData.get("channelId") as string;

    // Verify ownership before deleting
    const channel = await getChannel({ id: channelId });
    if (!channel || channel.userId !== user.id) {
      return { success: false, error: "Channel not found or not authorized" };
    }

    await deleteChannel({ id: channelId });
    return { success: true };
  }

  return { success: false };
}

export default function ChannelsIndex({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    channel: ChannelWithStats | null;
  }>({ open: false, channel: null });

  const isDeleting = fetcher.state === "submitting";

  // Close modal and revalidate when delete completes
  useEffect(() => {
    if (fetcher.data?.success && deleteModal.open) {
      setDeleteModal({ open: false, channel: null });
    }
  }, [fetcher.data, deleteModal.open]);

  const handleEdit = (id: string) => {
    navigate(`/dashboard/channels/${id}/edit`);
  };

  const handleDelete = (id: string) => {
    const channel = loaderData.channels.find((c) => c.id === id);
    if (channel) {
      setDeleteModal({ open: true, channel });
    }
  };

  const confirmDelete = () => {
    if (!deleteModal.channel) return;

    fetcher.submit(
      { intent: "delete", channelId: deleteModal.channel.id },
      { method: "POST" }
    );
  };

  return (
    <>
      <ChannelsListPage
        channels={loaderData.channels}
        onEditChannel={handleEdit}
        onDeleteChannel={handleDelete}
      />
      {deleteModal.channel && (
        <DeleteChannelModal
          opened={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, channel: null })}
          onConfirm={confirmDelete}
          channelName={deleteModal.channel.name}
          configCount={deleteModal.channel.configCount}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}

export function ErrorBoundary() {
  return (
    <RouteErrorBoundary
      backPath="/dashboard"
      backLabel="Back to Dashboard"
      errorMessage="Failed to load your channels. Please try again."
    />
  );
}
