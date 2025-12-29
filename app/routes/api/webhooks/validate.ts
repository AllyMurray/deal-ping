import type { Route } from "./+types/validate";
import { requireUser } from "~/lib/auth";
import { z } from "zod";

// Discord webhook info response schema
const DiscordWebhookInfoSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  avatar: z.string().nullable(),
  channel_id: z.string(),
  guild_id: z.string().nullable(),
});

export type DiscordWebhookInfo = z.infer<typeof DiscordWebhookInfoSchema>;

export interface WebhookValidationResult {
  valid: boolean;
  webhookName?: string;
  error?: string;
}

// POST /api/webhooks/validate
export async function action({
  request,
}: Route.ActionArgs): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  await requireUser(request);

  const body = await request.json();
  const webhookUrl = body.webhookUrl;

  if (!webhookUrl || typeof webhookUrl !== "string") {
    return Response.json(
      { valid: false, error: "webhookUrl is required" } as WebhookValidationResult,
      { status: 400 }
    );
  }

  if (!webhookUrl.includes("discord.com/api/webhooks/")) {
    return Response.json(
      {
        valid: false,
        error: "Invalid Discord webhook URL format",
      } as WebhookValidationResult,
      { status: 400 }
    );
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
        return Response.json({
          valid: false,
          error: "Webhook not found. It may have been deleted.",
        } as WebhookValidationResult);
      }
      if (response.status === 401) {
        return Response.json({
          valid: false,
          error: "Webhook URL is invalid or malformed.",
        } as WebhookValidationResult);
      }
      return Response.json({
        valid: false,
        error: `Discord API error: ${response.status}`,
      } as WebhookValidationResult);
    }

    const data = await response.json();
    const parsed = DiscordWebhookInfoSchema.safeParse(data);

    if (!parsed.success) {
      return Response.json({
        valid: false,
        error: "Unexpected response from Discord",
      } as WebhookValidationResult);
    }

    return Response.json({
      valid: true,
      webhookName: parsed.data.name ?? "Unnamed webhook",
    } as WebhookValidationResult);
  } catch {
    return Response.json({
      valid: false,
      error: "Failed to connect to Discord. Please try again.",
    } as WebhookValidationResult);
  }
}
