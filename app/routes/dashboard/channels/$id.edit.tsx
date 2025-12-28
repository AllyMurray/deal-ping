import { redirect, useNavigate, useActionData } from "react-router";
import { useEffect } from "react";
import { notifications } from "@mantine/notifications";
import type { Route } from "./+types/$id.edit";
import { ChannelEditPage } from "~/pages/dashboard";
import { requireUser } from "~/lib/auth";
import { getChannel, updateChannel } from "~/db/repository.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requireUser(request);
  const channel = await getChannel({ id: params.id! });

  if (!channel || channel.userId !== user.id) {
    throw new Response("Channel not found", { status: 404 });
  }

  return {
    channel: {
      id: channel.channelId,
      name: channel.name,
      webhookUrl: channel.webhookUrl,
      quietHoursEnabled: channel.quietHoursEnabled ?? false,
      quietHoursStart: channel.quietHoursStart ?? "22:00",
      quietHoursEnd: channel.quietHoursEnd ?? "08:00",
      quietHoursTimezone: channel.quietHoursTimezone ?? "Europe/London",
    },
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requireUser(request);
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const webhookUrl = formData.get("webhookUrl") as string;
  const quietHoursEnabled = formData.get("quietHoursEnabled") === "on";
  const quietHoursStart = formData.get("quietHoursStart") as string;
  const quietHoursEnd = formData.get("quietHoursEnd") as string;
  const quietHoursTimezone = formData.get("quietHoursTimezone") as string;

  // Verify ownership before updating
  const channel = await getChannel({ id: params.id! });
  if (!channel || channel.userId !== user.id) {
    throw new Response("Channel not found", { status: 404 });
  }

  try {
    await updateChannel({
      id: params.id!,
      name,
      webhookUrl,
      quietHoursEnabled,
      quietHoursStart: quietHoursEnabled ? quietHoursStart : undefined,
      quietHoursEnd: quietHoursEnabled ? quietHoursEnd : undefined,
      quietHoursTimezone: quietHoursEnabled ? quietHoursTimezone : undefined,
    });
    return redirect(`/dashboard/channels/${params.id}`);
  } catch {
    return { error: "Failed to update channel. Please try again." };
  }
}

export default function EditChannel({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const actionData = useActionData<typeof action>();

  useEffect(() => {
    if (actionData && "error" in actionData) {
      notifications.show({
        title: "Error",
        message: actionData.error,
        color: "red",
      });
    }
  }, [actionData]);

  return (
    <ChannelEditPage
      channel={loaderData.channel}
      onCancel={() => navigate(`/dashboard/channels/${loaderData.channel.id}`)}
    />
  );
}
