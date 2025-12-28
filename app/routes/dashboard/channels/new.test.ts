import { describe, it, expect, vi, beforeEach } from "vitest";
import { fromPartial } from "@total-typescript/shoehorn";
import { action } from "./new";

// Mock dependencies
vi.mock("react-router", () => ({
  redirect: vi.fn((url: string) => {
    return new Response(null, {
      status: 302,
      headers: { Location: url },
    });
  }),
}));

vi.mock("~/lib/auth", () => ({
  requireUser: vi.fn(),
}));

vi.mock("~/db/repository.server", () => ({
  createChannel: vi.fn(),
}));

// Import mocks for assertions
import { redirect } from "react-router";
import { requireUser } from "~/lib/auth";
import { createChannel } from "~/db/repository.server";

const mockRedirect = vi.mocked(redirect);
const mockRequireUser = vi.mocked(requireUser);
const mockCreateChannel = vi.mocked(createChannel);

describe("New Channel Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("action", () => {
    it("creates channel and redirects on success", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockCreateChannel.mockResolvedValue({
        channelId: "ch-new",
        userId: "user-123",
        name: "New Channel",
        webhookUrl: "https://webhook.example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const formData = new FormData();
      formData.append("name", "New Channel");
      formData.append("webhookUrl", "https://webhook.example.com");

      const request = new Request("http://localhost/dashboard/channels/new", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} });

      expect(mockCreateChannel).toHaveBeenCalledWith({
        userId: "user-123",
        name: "New Channel",
        webhookUrl: "https://webhook.example.com",
      });
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard/channels/ch-new");
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(302);
    });

    it("returns error when channel creation fails", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockCreateChannel.mockRejectedValue(new Error("Database error"));

      const formData = new FormData();
      formData.append("name", "New Channel");
      formData.append("webhookUrl", "https://webhook.example.com");

      const request = new Request("http://localhost/dashboard/channels/new", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} });

      expect(result).toEqual({
        error: "Failed to create channel. Please try again.",
      });
    });

    it("throws redirect when user is not authenticated", async () => {
      mockRequireUser.mockRejectedValue(
        new Response(null, {
          status: 302,
          headers: { Location: "/auth/login" },
        })
      );

      const formData = new FormData();
      formData.append("name", "New Channel");
      formData.append("webhookUrl", "https://webhook.example.com");

      const request = new Request("http://localhost/dashboard/channels/new", {
        method: "POST",
        body: formData,
      });

      await expect(action({ request, params: {}, context: {} })).rejects.toThrow();
    });
  });
});
