import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateDiscordWebhook } from "./webhook-validation.server";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("validateDiscordWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error for invalid webhook URL format", async () => {
    const result = await validateDiscordWebhook("https://example.com/webhook");

    expect(result).toEqual({
      intent: "validate",
      valid: false,
      error: "Invalid Discord webhook URL format",
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns success for valid webhook", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "123456789",
        name: "Test Webhook",
        avatar: null,
        channel_id: "987654321",
        guild_id: "111222333",
      }),
    });

    const result = await validateDiscordWebhook(
      "https://discord.com/api/webhooks/123/abc"
    );

    expect(result).toEqual({
      intent: "validate",
      valid: true,
      webhookName: "Test Webhook",
    });
  });

  it("returns 'Unnamed webhook' when webhook name is null", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "123456789",
        name: null,
        avatar: null,
        channel_id: "987654321",
        guild_id: "111222333",
      }),
    });

    const result = await validateDiscordWebhook(
      "https://discord.com/api/webhooks/123/abc"
    );

    expect(result).toEqual({
      intent: "validate",
      valid: true,
      webhookName: "Unnamed webhook",
    });
  });

  it("returns error for 404 response (webhook deleted)", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await validateDiscordWebhook(
      "https://discord.com/api/webhooks/123/abc"
    );

    expect(result).toEqual({
      intent: "validate",
      valid: false,
      error: "Webhook not found. It may have been deleted.",
    });
  });

  it("returns error for 401 response (invalid webhook)", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
    });

    const result = await validateDiscordWebhook(
      "https://discord.com/api/webhooks/123/abc"
    );

    expect(result).toEqual({
      intent: "validate",
      valid: false,
      error: "Webhook URL is invalid or malformed.",
    });
  });

  it("returns error for other Discord API errors", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await validateDiscordWebhook(
      "https://discord.com/api/webhooks/123/abc"
    );

    expect(result).toEqual({
      intent: "validate",
      valid: false,
      error: "Discord API error: 500",
    });
  });

  it("returns error when fetch throws", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const result = await validateDiscordWebhook(
      "https://discord.com/api/webhooks/123/abc"
    );

    expect(result).toEqual({
      intent: "validate",
      valid: false,
      error: "Failed to connect to Discord. Please try again.",
    });
  });

  it("returns error for unexpected response format", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        unexpected: "data",
      }),
    });

    const result = await validateDiscordWebhook(
      "https://discord.com/api/webhooks/123/abc"
    );

    expect(result).toEqual({
      intent: "validate",
      valid: false,
      error: "Unexpected response from Discord",
    });
  });

  it("calls fetch with correct parameters", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "123456789",
        name: "Test Webhook",
        avatar: null,
        channel_id: "987654321",
        guild_id: "111222333",
      }),
    });

    const webhookUrl = "https://discord.com/api/webhooks/123/abc";
    await validateDiscordWebhook(webhookUrl);

    expect(mockFetch).toHaveBeenCalledWith(webhookUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  });
});
