import { z } from "zod";

// Discord webhook info response schema
const DiscordWebhookInfoSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  avatar: z.string().nullable(),
  channel_id: z.string(),
  guild_id: z.string().nullable(),
});

export interface WebhookValidationResult {
  intent: "validate";
  valid: boolean;
  webhookName?: string;
  error?: string;
}

export async function validateDiscordWebhook(
  webhookUrl: string
): Promise<WebhookValidationResult> {
  if (!webhookUrl.includes("discord.com/api/webhooks/")) {
    return {
      intent: "validate",
      valid: false,
      error: "Invalid Discord webhook URL format",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          intent: "validate",
          valid: false,
          error: "Webhook not found. It may have been deleted.",
        };
      }
      if (response.status === 401) {
        return {
          intent: "validate",
          valid: false,
          error: "Webhook URL is invalid or malformed.",
        };
      }
      return {
        intent: "validate",
        valid: false,
        error: `Discord API error: ${response.status}`,
      };
    }

    const data = await response.json();
    const parsed = DiscordWebhookInfoSchema.safeParse(data);

    if (!parsed.success) {
      return {
        intent: "validate",
        valid: false,
        error: "Unexpected response from Discord",
      };
    }

    return {
      intent: "validate",
      valid: true,
      webhookName: parsed.data.name ?? "Unnamed webhook",
    };
  } catch {
    return {
      intent: "validate",
      valid: false,
      error: "Failed to connect to Discord. Please try again.",
    };
  }
}
