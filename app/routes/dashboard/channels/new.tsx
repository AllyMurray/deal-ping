import { redirect, useNavigate, useActionData } from "react-router";
import { useEffect } from "react";
import { notifications } from "@mantine/notifications";
import type { Route } from "./+types/new";
import { ChannelNewPage } from "~/pages/dashboard";
import { requireUser } from "~/lib/auth";
import { createChannel } from "~/db/repository.server";

export async function action({ request }: Route.ActionArgs) {
  const { user } = await requireUser(request);
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const webhookUrl = formData.get("webhookUrl") as string;
  const quietHoursEnabled = formData.get("quietHoursEnabled") === "on";
  const quietHoursStart = formData.get("quietHoursStart") as string;
  const quietHoursEnd = formData.get("quietHoursEnd") as string;
  const quietHoursTimezone = formData.get("quietHoursTimezone") as string;

  try {
    const channel = await createChannel({
      userId: user.id,
      name,
      webhookUrl,
      quietHoursEnabled,
      quietHoursStart: quietHoursEnabled ? quietHoursStart : undefined,
      quietHoursEnd: quietHoursEnabled ? quietHoursEnd : undefined,
      quietHoursTimezone: quietHoursEnabled ? quietHoursTimezone : undefined,
    });
    return redirect(`/dashboard/channels/${channel.channelId}`);
  } catch {
    return { error: "Failed to create channel. Please try again." };
  }
}

export default function NewChannel() {
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

  return <ChannelNewPage onCancel={() => navigate("/dashboard/channels")} />;
}
