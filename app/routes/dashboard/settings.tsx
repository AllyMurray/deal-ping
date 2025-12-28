import { useEffect } from "react";
import { useActionData } from "react-router";
import { notifications } from "@mantine/notifications";
import type { Route } from "./+types/settings";
import { SettingsPage } from "~/pages/dashboard";
import { requireUser } from "~/lib/auth";
import { getAllowedUser, updateUserSettings } from "~/db/repository.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireUser(request);
  const allowedUser = await getAllowedUser({ discordId: user.id });

  return {
    settings: {
      quietHoursEnabled: allowedUser?.quietHoursEnabled ?? false,
      quietHoursStart: allowedUser?.quietHoursStart ?? "22:00",
      quietHoursEnd: allowedUser?.quietHoursEnd ?? "08:00",
      quietHoursTimezone:
        allowedUser?.quietHoursTimezone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { user } = await requireUser(request);
  const formData = await request.formData();

  const quietHoursEnabled = formData.get("quietHoursEnabled") === "on";
  const quietHoursStart = formData.get("quietHoursStart") as string;
  const quietHoursEnd = formData.get("quietHoursEnd") as string;
  const quietHoursTimezone = formData.get("quietHoursTimezone") as string;

  try {
    await updateUserSettings({
      discordId: user.id,
      quietHoursEnabled,
      quietHoursStart: quietHoursEnabled ? quietHoursStart : undefined,
      quietHoursEnd: quietHoursEnabled ? quietHoursEnd : undefined,
      quietHoursTimezone: quietHoursEnabled ? quietHoursTimezone : undefined,
    });

    return { success: true };
  } catch {
    return { success: false, error: "Failed to save settings. Please try again." };
  }
}

export default function Settings({ loaderData }: Route.ComponentProps) {
  const actionData = useActionData<typeof action>();

  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        notifications.show({
          title: "Settings saved",
          message: "Your settings have been updated successfully.",
          color: "green",
        });
      } else if ("error" in actionData) {
        notifications.show({
          title: "Error",
          message: actionData.error,
          color: "red",
        });
      }
    }
  }, [actionData]);

  return <SettingsPage settings={loaderData.settings} />;
}
