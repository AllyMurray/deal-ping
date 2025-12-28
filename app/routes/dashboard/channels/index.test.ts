import { describe, it, expect, vi, beforeEach } from "vitest";
import { fromPartial } from "@total-typescript/shoehorn";
import { loader, action } from "./index";

// Mock dependencies
vi.mock("react-router", () => ({
  redirect: vi.fn((url: string) => {
    const error = new Response(null, {
      status: 302,
      headers: { Location: url },
    });
    throw error;
  }),
}));

vi.mock("~/lib/auth", () => ({
  requireUser: vi.fn(),
}));

vi.mock("~/db/repository.server", () => ({
  getChannelsByUser: vi.fn(),
  getChannel: vi.fn(),
  getConfigsByChannel: vi.fn(),
  deleteChannel: vi.fn(),
}));

// Import mocks for assertions
import { requireUser } from "~/lib/auth";
import {
  getChannelsByUser,
  getChannel,
  getConfigsByChannel,
  deleteChannel,
} from "~/db/repository.server";

const mockRequireUser = vi.mocked(requireUser);
const mockGetChannelsByUser = vi.mocked(getChannelsByUser);
const mockGetChannel = vi.mocked(getChannel);
const mockGetConfigsByChannel = vi.mocked(getConfigsByChannel);
const mockDeleteChannel = vi.mocked(deleteChannel);

describe("Channels Index Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loader", () => {
    it("returns channels with stats for authenticated user", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetChannelsByUser.mockResolvedValue([
        {
          channelId: "ch-1",
          userId: "user-123",
          name: "Channel 1",
          webhookUrl: "https://webhook1.example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          channelId: "ch-2",
          userId: "user-123",
          name: "Channel 2",
          webhookUrl: "https://webhook2.example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Channel 1 has 3 configs, 2 enabled
      mockGetConfigsByChannel.mockResolvedValueOnce([
        fromPartial({ configId: "cfg-1", enabled: true }),
        fromPartial({ configId: "cfg-2", enabled: true }),
        fromPartial({ configId: "cfg-3", enabled: false }),
      ]);

      // Channel 2 has 1 config, 1 enabled
      mockGetConfigsByChannel.mockResolvedValueOnce([
        fromPartial({ configId: "cfg-4", enabled: true }),
      ]);

      const request = new Request("http://localhost/dashboard/channels");
      const result = await loader({ request, params: {}, context: {} });

      expect(mockRequireUser).toHaveBeenCalledWith(request);
      expect(mockGetChannelsByUser).toHaveBeenCalledWith({ userId: "user-123" });
      expect(result.channels).toEqual([
        {
          id: "ch-1",
          name: "Channel 1",
          webhookUrl: "https://webhook1.example.com",
          configCount: 3,
          enabledConfigCount: 2,
        },
        {
          id: "ch-2",
          name: "Channel 2",
          webhookUrl: "https://webhook2.example.com",
          configCount: 1,
          enabledConfigCount: 1,
        },
      ]);
    });

    it("returns empty array when user has no channels", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetChannelsByUser.mockResolvedValue([]);

      const request = new Request("http://localhost/dashboard/channels");
      const result = await loader({ request, params: {}, context: {} });

      expect(result.channels).toEqual([]);
    });

    it("throws redirect when user is not authenticated", async () => {
      mockRequireUser.mockRejectedValue(
        new Response(null, {
          status: 302,
          headers: { Location: "/auth/login?redirectTo=%2Fdashboard%2Fchannels" },
        })
      );

      const request = new Request("http://localhost/dashboard/channels");

      await expect(loader({ request, params: {}, context: {} })).rejects.toThrow();
    });
  });

  describe("action", () => {
    describe("delete intent", () => {
      it("successfully deletes a channel when user is owner", async () => {
        mockRequireUser.mockResolvedValue(
          fromPartial({
            user: { id: "user-123", username: "testuser" },
          })
        );

        mockGetChannel.mockResolvedValue({
          channelId: "ch-1",
          userId: "user-123",
          name: "Channel 1",
          webhookUrl: "https://webhook.example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        mockDeleteChannel.mockResolvedValue(undefined);

        const formData = new FormData();
        formData.append("intent", "delete");
        formData.append("channelId", "ch-1");

        const request = new Request("http://localhost/dashboard/channels", {
          method: "POST",
          body: formData,
        });

        const result = await action({ request, params: {}, context: {} });

        expect(mockGetChannel).toHaveBeenCalledWith({ id: "ch-1" });
        expect(mockDeleteChannel).toHaveBeenCalledWith({ id: "ch-1" });
        expect(result).toEqual({ success: true });
      });

      it("returns error when channel does not exist", async () => {
        mockRequireUser.mockResolvedValue(
          fromPartial({
            user: { id: "user-123", username: "testuser" },
          })
        );

        mockGetChannel.mockResolvedValue(null);

        const formData = new FormData();
        formData.append("intent", "delete");
        formData.append("channelId", "nonexistent-channel");

        const request = new Request("http://localhost/dashboard/channels", {
          method: "POST",
          body: formData,
        });

        const result = await action({ request, params: {}, context: {} });

        expect(mockDeleteChannel).not.toHaveBeenCalled();
        expect(result).toEqual({
          success: false,
          error: "Channel not found or not authorized",
        });
      });

      it("returns error when user does not own the channel", async () => {
        mockRequireUser.mockResolvedValue(
          fromPartial({
            user: { id: "user-123", username: "testuser" },
          })
        );

        mockGetChannel.mockResolvedValue({
          channelId: "ch-1",
          userId: "other-user-456",
          name: "Other User Channel",
          webhookUrl: "https://webhook.example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const formData = new FormData();
        formData.append("intent", "delete");
        formData.append("channelId", "ch-1");

        const request = new Request("http://localhost/dashboard/channels", {
          method: "POST",
          body: formData,
        });

        const result = await action({ request, params: {}, context: {} });

        expect(mockDeleteChannel).not.toHaveBeenCalled();
        expect(result).toEqual({
          success: false,
          error: "Channel not found or not authorized",
        });
      });
    });

    describe("invalid intent", () => {
      it("returns success: false for unknown intent", async () => {
        mockRequireUser.mockResolvedValue(
          fromPartial({
            user: { id: "user-123", username: "testuser" },
          })
        );

        const formData = new FormData();
        formData.append("intent", "unknown");

        const request = new Request("http://localhost/dashboard/channels", {
          method: "POST",
          body: formData,
        });

        const result = await action({ request, params: {}, context: {} });

        expect(result).toEqual({ success: false });
      });

      it("returns success: false when no intent provided", async () => {
        mockRequireUser.mockResolvedValue(
          fromPartial({
            user: { id: "user-123", username: "testuser" },
          })
        );

        const formData = new FormData();

        const request = new Request("http://localhost/dashboard/channels", {
          method: "POST",
          body: formData,
        });

        const result = await action({ request, params: {}, context: {} });

        expect(result).toEqual({ success: false });
      });
    });

    it("throws redirect when user is not authenticated", async () => {
      mockRequireUser.mockRejectedValue(
        new Response(null, {
          status: 302,
          headers: { Location: "/auth/login?redirectTo=%2Fdashboard%2Fchannels" },
        })
      );

      const formData = new FormData();
      formData.append("intent", "delete");
      formData.append("channelId", "ch-1");

      const request = new Request("http://localhost/dashboard/channels", {
        method: "POST",
        body: formData,
      });

      await expect(action({ request, params: {}, context: {} })).rejects.toThrow();
    });
  });
});
