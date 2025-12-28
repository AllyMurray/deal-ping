import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import type { Route } from "./+types/$id";
import { ChannelDetailPage } from "~/pages/dashboard";
import {
  ConfigFormModal,
  DeleteConfigModal,
  type ConfigFormValues,
} from "~/components/configs";
import { RouteErrorBoundary } from "~/components/ui";
import { notifications } from "@mantine/notifications";
import { requireUser } from "~/lib/auth";
import {
  getChannel,
  getConfigsByChannel,
  getConfig,
  upsertConfig,
  deleteConfig,
} from "~/db/repository.server";
import { HotUKDealsService } from "../../../../src/db/service";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requireUser(request);
  const channel = await getChannel({ id: params.id! });

  if (!channel || channel.userId !== user.id) {
    throw new Response("Channel not found", { status: 404 });
  }

  const configs = await getConfigsByChannel({ channelId: params.id! });
  const searchTerms = configs.map((c) => c.searchTerm);

  // Fetch deals for this channel's search terms
  const result = await HotUKDealsService.entities.deal.scan.go({ limit: 500 });
  let deals = result.data.filter((d) => searchTerms.includes(d.searchTerm));

  // Sort by timestamp descending
  deals.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // Limit to 100 deals
  deals = deals.slice(0, 100);

  return {
    channel: {
      id: channel.channelId,
      name: channel.name,
      webhookUrl: channel.webhookUrl,
    },
    configs: configs.map((c) => ({
      searchTerm: c.searchTerm,
      enabled: c.enabled,
      includeKeywords: c.includeKeywords || [],
      excludeKeywords: c.excludeKeywords || [],
    })),
    deals: deals.map((d) => ({
      id: d.dealId,
      title: d.title,
      link: d.link,
      price: d.price,
      merchant: d.merchant,
      searchTerm: d.searchTerm,
      timestamp: d.timestamp,
      matchDetails: d.matchDetails,
      filterStatus: d.filterStatus,
      filterReason: d.filterReason,
    })),
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requireUser(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Verify channel ownership for all actions
  const channel = await getChannel({ id: params.id! });
  if (!channel || channel.userId !== user.id) {
    return { success: false, error: "Channel not found or not authorized" };
  }

  if (intent === "upsertConfig") {
    const searchTerm = formData.get("searchTerm") as string;
    const enabled = formData.get("enabled") === "true";
    const includeKeywords = JSON.parse(
      (formData.get("includeKeywords") as string) || "[]"
    );
    const excludeKeywords = JSON.parse(
      (formData.get("excludeKeywords") as string) || "[]"
    );
    const caseSensitive = formData.get("caseSensitive") === "true";

    await upsertConfig({
      userId: user.id,
      channelId: params.id!,
      searchTerm,
      enabled,
      includeKeywords,
      excludeKeywords,
      caseSensitive,
    });

    return { success: true };
  }

  if (intent === "deleteConfig") {
    const searchTerm = formData.get("searchTerm") as string;
    await deleteConfig({ channelId: params.id!, searchTerm });
    return { success: true };
  }

  if (intent === "toggleConfig") {
    const searchTerm = formData.get("searchTerm") as string;
    const enabled = formData.get("enabled") === "true";

    // Get existing config to preserve userId
    const existingConfig = await getConfig({ channelId: params.id!, searchTerm });
    if (!existingConfig) {
      return { success: false, error: "Config not found" };
    }

    await upsertConfig({
      userId: user.id,
      channelId: params.id!,
      searchTerm,
      enabled,
    });

    return { success: true };
  }

  if (intent === "testNotification") {
    try {
      const response = await fetch(channel.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: "Test Notification",
              description:
                "This is a test notification from HotUKDeals Notifier. If you see this, your webhook is working correctly!",
              color: 0xff8510,
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });

      if (!response.ok) {
        return { success: false, error: "Webhook returned error" };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to send notification" };
    }
  }

  return { success: false };
}

export default function ChannelDetail({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher<typeof action>();

  const [configModal, setConfigModal] = useState<{
    open: boolean;
    config: ConfigFormValues | null;
    isEditing: boolean;
  }>({ open: false, config: null, isEditing: false });

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    searchTerm: string | null;
  }>({ open: false, searchTerm: null });

  const [showFiltered, setShowFiltered] = useState(false);

  // Track which operation is in progress using fetcher.formData
  const pendingIntent = fetcher.formData?.get("intent");
  const isSubmitting = fetcher.state !== "idle" && pendingIntent === "upsertConfig";
  const isDeleting = fetcher.state !== "idle" && pendingIntent === "deleteConfig";
  const isTesting = fetcher.state !== "idle" && pendingIntent === "testNotification";

  // Track the last intent for showing notifications after completion
  const [lastIntent, setLastIntent] = useState<string | null>(null);

  // Update lastIntent when a new submission starts
  useEffect(() => {
    if (fetcher.state === "submitting" && pendingIntent) {
      setLastIntent(pendingIntent as string);
    }
  }, [fetcher.state, pendingIntent]);

  // Handle fetcher completion
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && lastIntent) {
      if (lastIntent === "testNotification") {
        if (fetcher.data.success) {
          notifications.show({
            title: "Success",
            message: "Test notification sent successfully!",
            color: "green",
          });
        } else {
          notifications.show({
            title: "Error",
            message: fetcher.data.error || "Failed to send test notification",
            color: "red",
          });
        }
      }

      if (lastIntent === "upsertConfig" && fetcher.data.success) {
        setConfigModal({ open: false, config: null, isEditing: false });
      }

      if (lastIntent === "deleteConfig" && fetcher.data.success) {
        setDeleteModal({ open: false, searchTerm: null });
      }

      setLastIntent(null);
    }
  }, [fetcher.state, fetcher.data, lastIntent]);

  const handleAddConfig = () => {
    setConfigModal({ open: true, config: null, isEditing: false });
  };

  const handleEditConfig = (searchTerm: string) => {
    const config = loaderData.configs.find((c) => c.searchTerm === searchTerm);
    if (config) {
      setConfigModal({
        open: true,
        config: { ...config, caseSensitive: false },
        isEditing: true,
      });
    }
  };

  const handleDeleteConfig = (searchTerm: string) => {
    setDeleteModal({ open: true, searchTerm });
  };

  const handleToggleConfig = (searchTerm: string, enabled: boolean) => {
    fetcher.submit(
      {
        intent: "toggleConfig",
        searchTerm,
        enabled: String(enabled),
      },
      { method: "POST" }
    );
  };

  const handleSubmitConfig = (values: ConfigFormValues) => {
    fetcher.submit(
      {
        intent: "upsertConfig",
        searchTerm: values.searchTerm,
        enabled: String(values.enabled),
        includeKeywords: JSON.stringify(values.includeKeywords),
        excludeKeywords: JSON.stringify(values.excludeKeywords),
        caseSensitive: String(values.caseSensitive),
      },
      { method: "POST" }
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteModal.searchTerm) return;

    fetcher.submit(
      {
        intent: "deleteConfig",
        searchTerm: deleteModal.searchTerm,
      },
      { method: "POST" }
    );
  };

  const handleTestNotification = () => {
    fetcher.submit(
      { intent: "testNotification" },
      { method: "POST" }
    );
  };

  return (
    <>
      <ChannelDetailPage
        channel={loaderData.channel}
        configs={loaderData.configs}
        deals={loaderData.deals}
        onAddConfig={handleAddConfig}
        onEditConfig={handleEditConfig}
        onDeleteConfig={handleDeleteConfig}
        onToggleConfig={handleToggleConfig}
        onTestNotification={handleTestNotification}
        isTestingNotification={isTesting}
        showFiltered={showFiltered}
        onShowFilteredChange={setShowFiltered}
      />

      <ConfigFormModal
        opened={configModal.open}
        onClose={() =>
          setConfigModal({ open: false, config: null, isEditing: false })
        }
        onSubmit={handleSubmitConfig}
        initialValues={configModal.config || undefined}
        isSubmitting={isSubmitting}
        isEditing={configModal.isEditing}
      />

      {deleteModal.searchTerm && (
        <DeleteConfigModal
          opened={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, searchTerm: null })}
          onConfirm={handleConfirmDelete}
          searchTerm={deleteModal.searchTerm}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}

export function ErrorBoundary() {
  return (
    <RouteErrorBoundary
      backPath="/dashboard/channels"
      backLabel="Back to Channels"
      notFoundTitle="Channel Not Found"
      notFoundMessage="This channel doesn't exist or you don't have access to it."
    />
  );
}
