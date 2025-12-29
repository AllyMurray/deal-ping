import { describe, it, expect, vi, beforeEach } from "vitest";
import { fromPartial } from "@total-typescript/shoehorn";
import { loader, action } from "./$id";

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
  getChannel: vi.fn(),
  getConfigsByChannel: vi.fn(),
  getConfig: vi.fn(),
  upsertConfig: vi.fn(),
  deleteConfig: vi.fn(),
}));

vi.mock("../../../../src/db/service", () => ({
  HotUKDealsService: {
    entities: {
      deal: {
        scan: {
          go: vi.fn().mockResolvedValue({ data: [] }),
        },
      },
    },
  },
}));

// Import mocks for assertions
import { requireUser } from "~/lib/auth";
import {
  getChannel,
  getConfigsByChannel,
  getConfig,
  upsertConfig,
  deleteConfig,
} from "~/db/repository.server";

const mockRequireUser = vi.mocked(requireUser);
const mockGetChannel = vi.mocked(getChannel);
const mockGetConfigsByChannel = vi.mocked(getConfigsByChannel);
const mockGetConfig = vi.mocked(getConfig);
const mockUpsertConfig = vi.mocked(upsertConfig);
const mockDeleteConfig = vi.mocked(deleteConfig);

describe("Channel Detail Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loader", () => {
    it("returns channel with configs for authorized user", async () => {
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

      mockGetConfigsByChannel.mockResolvedValue([
        {
          configId: "cfg-1",
          channelId: "ch-1",
          userId: "user-123",
          searchTerm: "iphone",
          enabled: true,
          includeKeywords: ["pro", "max"],
          excludeKeywords: ["case"],
          caseSensitive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const request = new Request("http://localhost/dashboard/channels/ch-1");
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
      expect(result.configs).toEqual([
        {
          searchTerm: "iphone",
          enabled: true,
          includeKeywords: ["pro", "max"],
          excludeKeywords: ["case"],
          caseSensitive: false,
          maxPrice: null,
          minDiscount: null,
        },
      ]);
      expect(result.deals).toEqual([]);
    });

    it("throws 404 when channel does not exist", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetChannel.mockResolvedValue(null);

      const request = new Request("http://localhost/dashboard/channels/ch-1");

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

      const request = new Request("http://localhost/dashboard/channels/ch-1");

      await expect(
        loader({ request, params: { id: "ch-1" }, context: {} })
      ).rejects.toThrow();
    });
  });

  describe("action", () => {
    describe("upsertConfig intent", () => {
      it("creates a new config successfully", async () => {
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

        mockUpsertConfig.mockResolvedValue(undefined);

        const formData = new FormData();
        formData.append("intent", "upsertConfig");
        formData.append("searchTerm", "iphone");
        formData.append("enabled", "true");
        formData.append("includeKeywords", '["pro"]');
        formData.append("excludeKeywords", '["case"]');
        formData.append("caseSensitive", "false");

        const request = new Request("http://localhost/dashboard/channels/ch-1", {
          method: "POST",
          body: formData,
        });

        const result = await action({
          request,
          params: { id: "ch-1" },
          context: {},
        });

        expect(mockUpsertConfig).toHaveBeenCalledWith({
          userId: "user-123",
          channelId: "ch-1",
          searchTerm: "iphone",
          enabled: true,
          includeKeywords: ["pro"],
          excludeKeywords: ["case"],
          caseSensitive: false,
          maxPrice: undefined,
          minDiscount: undefined,
        });
        expect(result).toEqual({ success: true });
      });
    });

    describe("deleteConfig intent", () => {
      it("deletes a config successfully", async () => {
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

        mockDeleteConfig.mockResolvedValue(undefined);

        const formData = new FormData();
        formData.append("intent", "deleteConfig");
        formData.append("searchTerm", "iphone");

        const request = new Request("http://localhost/dashboard/channels/ch-1", {
          method: "POST",
          body: formData,
        });

        const result = await action({
          request,
          params: { id: "ch-1" },
          context: {},
        });

        expect(mockDeleteConfig).toHaveBeenCalledWith({
          channelId: "ch-1",
          searchTerm: "iphone",
        });
        expect(result).toEqual({ success: true });
      });
    });

    describe("toggleConfig intent", () => {
      it("toggles config enabled state", async () => {
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

        mockGetConfig.mockResolvedValue(
          fromPartial({
            configId: "cfg-1",
            channelId: "ch-1",
            searchTerm: "iphone",
            enabled: true,
          })
        );

        mockUpsertConfig.mockResolvedValue(undefined);

        const formData = new FormData();
        formData.append("intent", "toggleConfig");
        formData.append("searchTerm", "iphone");
        formData.append("enabled", "false");

        const request = new Request("http://localhost/dashboard/channels/ch-1", {
          method: "POST",
          body: formData,
        });

        const result = await action({
          request,
          params: { id: "ch-1" },
          context: {},
        });

        expect(mockUpsertConfig).toHaveBeenCalledWith({
          userId: "user-123",
          channelId: "ch-1",
          searchTerm: "iphone",
          enabled: false,
        });
        expect(result).toEqual({ success: true });
      });

      it("returns error when config not found", async () => {
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

        mockGetConfig.mockResolvedValue(null);

        const formData = new FormData();
        formData.append("intent", "toggleConfig");
        formData.append("searchTerm", "nonexistent");
        formData.append("enabled", "false");

        const request = new Request("http://localhost/dashboard/channels/ch-1", {
          method: "POST",
          body: formData,
        });

        const result = await action({
          request,
          params: { id: "ch-1" },
          context: {},
        });

        expect(result).toEqual({ success: false, error: "Config not found" });
      });
    });

    describe("testNotification intent", () => {
      it("sends test notification successfully", async () => {
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

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
        });

        const formData = new FormData();
        formData.append("intent", "testNotification");

        const request = new Request("http://localhost/dashboard/channels/ch-1", {
          method: "POST",
          body: formData,
        });

        const result = await action({
          request,
          params: { id: "ch-1" },
          context: {},
        });

        expect(global.fetch).toHaveBeenCalledWith(
          "https://webhook.example.com",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
          })
        );
        expect(result).toEqual({ success: true });
      });

      it("returns error when webhook fails", async () => {
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

        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
        });

        const formData = new FormData();
        formData.append("intent", "testNotification");

        const request = new Request("http://localhost/dashboard/channels/ch-1", {
          method: "POST",
          body: formData,
        });

        const result = await action({
          request,
          params: { id: "ch-1" },
          context: {},
        });

        expect(result).toEqual({ success: false, error: "Webhook returned error" });
      });

      it("returns error when fetch throws", async () => {
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

        global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

        const formData = new FormData();
        formData.append("intent", "testNotification");

        const request = new Request("http://localhost/dashboard/channels/ch-1", {
          method: "POST",
          body: formData,
        });

        const result = await action({
          request,
          params: { id: "ch-1" },
          context: {},
        });

        expect(result).toEqual({ success: false, error: "Failed to send notification" });
      });
    });

    it("returns error when channel not found or not authorized", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetChannel.mockResolvedValue(null);

      const formData = new FormData();
      formData.append("intent", "upsertConfig");
      formData.append("searchTerm", "iphone");

      const request = new Request("http://localhost/dashboard/channels/ch-1", {
        method: "POST",
        body: formData,
      });

      const result = await action({
        request,
        params: { id: "ch-1" },
        context: {},
      });

      expect(result).toEqual({
        success: false,
        error: "Channel not found or not authorized",
      });
    });

    it("returns success: false for unknown intent", async () => {
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

      const formData = new FormData();
      formData.append("intent", "unknown");

      const request = new Request("http://localhost/dashboard/channels/ch-1", {
        method: "POST",
        body: formData,
      });

      const result = await action({
        request,
        params: { id: "ch-1" },
        context: {},
      });

      expect(result).toEqual({ success: false });
    });
  });
});
