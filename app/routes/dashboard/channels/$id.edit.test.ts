import { describe, it, expect, vi, beforeEach } from "vitest";
import { fromPartial } from "@total-typescript/shoehorn";
import { loader, action } from "./$id.edit";

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
  getChannel: vi.fn(),
  updateChannel: vi.fn(),
}));

// Import mocks for assertions
import { redirect } from "react-router";
import { requireUser } from "~/lib/auth";
import { getChannel, updateChannel } from "~/db/repository.server";

const mockRedirect = vi.mocked(redirect);
const mockRequireUser = vi.mocked(requireUser);
const mockGetChannel = vi.mocked(getChannel);
const mockUpdateChannel = vi.mocked(updateChannel);

describe("Channel Edit Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loader", () => {
    it("returns channel data for authorized user", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetChannel.mockResolvedValue({
        channelId: "ch-1",
        userId: "user-123",
        name: "Test Channel",
        webhookUrl: "https://webhook.example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request("http://localhost/dashboard/channels/ch-1/edit");
      const result = await loader({
        request,
        params: { id: "ch-1" },
        context: {},
      });

      expect(result.channel).toEqual({
        id: "ch-1",
        name: "Test Channel",
        webhookUrl: "https://webhook.example.com",
      });
    });

    it("throws 404 when channel does not exist", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetChannel.mockResolvedValue(null);

      const request = new Request("http://localhost/dashboard/channels/ch-1/edit");

      await expect(
        loader({ request, params: { id: "ch-1" }, context: {} })
      ).rejects.toThrow();
    });

    it("throws 404 when user does not own channel", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetChannel.mockResolvedValue({
        channelId: "ch-1",
        userId: "other-user",
        name: "Test Channel",
        webhookUrl: "https://webhook.example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request("http://localhost/dashboard/channels/ch-1/edit");

      await expect(
        loader({ request, params: { id: "ch-1" }, context: {} })
      ).rejects.toThrow();
    });
  });

  describe("action", () => {
    it("updates channel and redirects on success", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetChannel.mockResolvedValue({
        channelId: "ch-1",
        userId: "user-123",
        name: "Old Name",
        webhookUrl: "https://old-webhook.example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUpdateChannel.mockResolvedValue(undefined);

      const formData = new FormData();
      formData.append("name", "Updated Channel");
      formData.append("webhookUrl", "https://new-webhook.example.com");

      const request = new Request("http://localhost/dashboard/channels/ch-1/edit", {
        method: "POST",
        body: formData,
      });

      const result = await action({ request, params: { id: "ch-1" }, context: {} });

      expect(mockUpdateChannel).toHaveBeenCalledWith({
        id: "ch-1",
        name: "Updated Channel",
        webhookUrl: "https://new-webhook.example.com",
      });
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard/channels/ch-1");
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(302);
    });

    it("throws 404 when channel does not exist", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetChannel.mockResolvedValue(null);

      const formData = new FormData();
      formData.append("name", "Updated Channel");
      formData.append("webhookUrl", "https://webhook.example.com");

      const request = new Request("http://localhost/dashboard/channels/ch-1/edit", {
        method: "POST",
        body: formData,
      });

      await expect(
        action({ request, params: { id: "ch-1" }, context: {} })
      ).rejects.toThrow();
    });

    it("throws 404 when user does not own channel", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetChannel.mockResolvedValue({
        channelId: "ch-1",
        userId: "other-user",
        name: "Test Channel",
        webhookUrl: "https://webhook.example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const formData = new FormData();
      formData.append("name", "Updated Channel");
      formData.append("webhookUrl", "https://webhook.example.com");

      const request = new Request("http://localhost/dashboard/channels/ch-1/edit", {
        method: "POST",
        body: formData,
      });

      await expect(
        action({ request, params: { id: "ch-1" }, context: {} })
      ).rejects.toThrow();
    });

    it("returns error when update fails", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetChannel.mockResolvedValue({
        channelId: "ch-1",
        userId: "user-123",
        name: "Test Channel",
        webhookUrl: "https://webhook.example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUpdateChannel.mockRejectedValue(new Error("Database error"));

      const formData = new FormData();
      formData.append("name", "Updated Channel");
      formData.append("webhookUrl", "https://webhook.example.com");

      const request = new Request("http://localhost/dashboard/channels/ch-1/edit", {
        method: "POST",
        body: formData,
      });

      const result = await action({
        request,
        params: { id: "ch-1" },
        context: {},
      });

      expect(result).toEqual({
        error: "Failed to update channel. Please try again.",
      });
    });
  });
});
