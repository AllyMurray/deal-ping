import { describe, it, expect, vi, beforeEach } from "vitest";
import { fromPartial } from "@total-typescript/shoehorn";
import { action } from "./validate";

// Mock dependencies
vi.mock("~/lib/auth", () => ({
  requireUser: vi.fn(),
}));

// Import mocks for assertions
import { requireUser } from "~/lib/auth";

const mockRequireUser = vi.mocked(requireUser);

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Webhook Validation API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockResolvedValue(
      fromPartial({
        user: { id: "user-123", username: "testuser" },
      })
    );
  });

  describe("action", () => {
    it("returns 405 for non-POST requests", async () => {
      const request = new Request("http://localhost/api/webhooks/validate", {
        method: "GET",
      });
      const response = await action({
        request,
        params: {},
        context: {},
      });

      expect(response.status).toBe(405);
    });

    it("returns error when webhookUrl is missing", async () => {
      const request = new Request("http://localhost/api/webhooks/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const response = await action({
        request,
        params: {},
        context: {},
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.valid).toBe(false);
      expect(data.error).toBe("webhookUrl is required");
    });

    it("returns error for invalid webhook URL format", async () => {
      const request = new Request("http://localhost/api/webhooks/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: "https://example.com/webhook" }),
      });
      const response = await action({
        request,
        params: {},
        context: {},
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.valid).toBe(false);
      expect(data.error).toBe("Invalid Discord webhook URL format");
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

      const request = new Request("http://localhost/api/webhooks/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: "https://discord.com/api/webhooks/123/abc",
        }),
      });
      const response = await action({
        request,
        params: {},
        context: {},
      });

      const data = await response.json();
      expect(data.valid).toBe(true);
      expect(data.webhookName).toBe("Test Webhook");
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

      const request = new Request("http://localhost/api/webhooks/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: "https://discord.com/api/webhooks/123/abc",
        }),
      });
      const response = await action({
        request,
        params: {},
        context: {},
      });

      const data = await response.json();
      expect(data.valid).toBe(true);
      expect(data.webhookName).toBe("Unnamed webhook");
    });

    it("returns error for 404 response (webhook deleted)", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const request = new Request("http://localhost/api/webhooks/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: "https://discord.com/api/webhooks/123/abc",
        }),
      });
      const response = await action({
        request,
        params: {},
        context: {},
      });

      const data = await response.json();
      expect(data.valid).toBe(false);
      expect(data.error).toBe("Webhook not found. It may have been deleted.");
    });

    it("returns error for 401 response (invalid webhook)", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      const request = new Request("http://localhost/api/webhooks/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: "https://discord.com/api/webhooks/123/abc",
        }),
      });
      const response = await action({
        request,
        params: {},
        context: {},
      });

      const data = await response.json();
      expect(data.valid).toBe(false);
      expect(data.error).toBe("Webhook URL is invalid or malformed.");
    });

    it("returns error for other Discord API errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const request = new Request("http://localhost/api/webhooks/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: "https://discord.com/api/webhooks/123/abc",
        }),
      });
      const response = await action({
        request,
        params: {},
        context: {},
      });

      const data = await response.json();
      expect(data.valid).toBe(false);
      expect(data.error).toBe("Discord API error: 500");
    });

    it("returns error when fetch throws", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const request = new Request("http://localhost/api/webhooks/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: "https://discord.com/api/webhooks/123/abc",
        }),
      });
      const response = await action({
        request,
        params: {},
        context: {},
      });

      const data = await response.json();
      expect(data.valid).toBe(false);
      expect(data.error).toBe("Failed to connect to Discord. Please try again.");
    });

    it("returns error for unexpected response format", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          unexpected: "data",
        }),
      });

      const request = new Request("http://localhost/api/webhooks/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: "https://discord.com/api/webhooks/123/abc",
        }),
      });
      const response = await action({
        request,
        params: {},
        context: {},
      });

      const data = await response.json();
      expect(data.valid).toBe(false);
      expect(data.error).toBe("Unexpected response from Discord");
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
      const request = new Request("http://localhost/api/webhooks/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl }),
      });
      await action({
        request,
        params: {},
        context: {},
      });

      expect(mockFetch).toHaveBeenCalledWith(webhookUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
    });
  });
});
