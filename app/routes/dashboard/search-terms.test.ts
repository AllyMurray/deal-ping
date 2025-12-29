import { describe, it, expect, vi, beforeEach } from "vitest";
import { fromPartial } from "@total-typescript/shoehorn";
import { loader } from "./search-terms";

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
  getConfigsByChannel: vi.fn(),
}));

// Import mocks for assertions
import { requireUser } from "~/lib/auth";
import { getChannelsByUser, getConfigsByChannel } from "~/db/repository.server";

const mockRequireUser = vi.mocked(requireUser);
const mockGetChannelsByUser = vi.mocked(getChannelsByUser);
const mockGetConfigsByChannel = vi.mocked(getConfigsByChannel);

describe("Search Terms Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loader", () => {
    it("returns search terms with channel info for authenticated user", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetChannelsByUser.mockResolvedValue([
        fromPartial({ channelId: "ch-1", name: "Gaming Deals" }),
        fromPartial({ channelId: "ch-2", name: "Tech Deals" }),
      ]);

      mockGetConfigsByChannel
        .mockResolvedValueOnce([
          fromPartial({
            searchTerm: "laptop",
            enabled: true,
            includeKeywords: ["gaming"],
            excludeKeywords: [],
            maxPrice: 50000,
          }),
        ])
        .mockResolvedValueOnce([
          fromPartial({
            searchTerm: "headphones",
            enabled: false,
            includeKeywords: [],
            excludeKeywords: ["wired"],
            minDiscount: 20,
          }),
        ]);

      const request = new Request("http://localhost/dashboard/search-terms");
      const result = await loader(fromPartial({ request, params: {}, context: {} }));

      expect(result.searchTerms).toHaveLength(2);
      expect(result.searchTerms[0]).toEqual({
        searchTerm: "headphones",
        channelId: "ch-2",
        channelName: "Tech Deals",
        enabled: false,
        includeKeywords: [],
        excludeKeywords: ["wired"],
        maxPrice: undefined,
        minDiscount: 20,
      });
      expect(result.searchTerms[1]).toEqual({
        searchTerm: "laptop",
        channelId: "ch-1",
        channelName: "Gaming Deals",
        enabled: true,
        includeKeywords: ["gaming"],
        excludeKeywords: [],
        maxPrice: 50000,
        minDiscount: undefined,
      });
    });

    it("returns empty array for user with no channels", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetChannelsByUser.mockResolvedValue([]);

      const request = new Request("http://localhost/dashboard/search-terms");
      const result = await loader(fromPartial({ request, params: {}, context: {} }));

      expect(result.searchTerms).toEqual([]);
    });

    it("returns empty array for channels with no search terms", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetChannelsByUser.mockResolvedValue([
        fromPartial({ channelId: "ch-1", name: "Empty Channel" }),
      ]);

      mockGetConfigsByChannel.mockResolvedValue([]);

      const request = new Request("http://localhost/dashboard/search-terms");
      const result = await loader(fromPartial({ request, params: {}, context: {} }));

      expect(result.searchTerms).toEqual([]);
    });

    it("throws redirect when user is not authenticated", async () => {
      mockRequireUser.mockRejectedValue(
        new Response(null, {
          status: 302,
          headers: { Location: "/auth/login" },
        })
      );

      const request = new Request("http://localhost/dashboard/search-terms");

      await expect(loader(fromPartial({ request, params: {}, context: {} }))).rejects.toThrow();
    });

    it("sorts search terms alphabetically", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetChannelsByUser.mockResolvedValue([
        fromPartial({ channelId: "ch-1", name: "Channel" }),
      ]);

      mockGetConfigsByChannel.mockResolvedValue([
        fromPartial({ searchTerm: "zebra", enabled: true, includeKeywords: [], excludeKeywords: [] }),
        fromPartial({ searchTerm: "apple", enabled: true, includeKeywords: [], excludeKeywords: [] }),
        fromPartial({ searchTerm: "Mango", enabled: true, includeKeywords: [], excludeKeywords: [] }),
      ]);

      const request = new Request("http://localhost/dashboard/search-terms");
      const result = await loader(fromPartial({ request, params: {}, context: {} }));

      expect(result.searchTerms.map((t) => t.searchTerm)).toEqual([
        "apple",
        "Mango",
        "zebra",
      ]);
    });
  });
});
