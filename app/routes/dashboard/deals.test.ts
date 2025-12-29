import { describe, it, expect, vi, beforeEach } from "vitest";
import { fromPartial } from "@total-typescript/shoehorn";
import { loader } from "./deals";

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
  getConfigsByUser: vi.fn(),
  getDealsBySearchTerm: vi.fn(),
}));

// Import mocks for assertions
import { requireUser } from "~/lib/auth";
import { getConfigsByUser, getDealsBySearchTerm } from "~/db/repository.server";

const mockRequireUser = vi.mocked(requireUser);
const mockGetConfigsByUser = vi.mocked(getConfigsByUser);
const mockGetDealsBySearchTerm = vi.mocked(getDealsBySearchTerm);

describe("Deals Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loader", () => {
    it("returns deals from user search terms using efficient queries", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetConfigsByUser.mockResolvedValue([
        fromPartial({ searchTerm: "iphone" }),
        fromPartial({ searchTerm: "macbook" }),
      ]);

      const now = Date.now();
      // Mock getDealsBySearchTerm to return deals for each search term
      mockGetDealsBySearchTerm
        .mockResolvedValueOnce([
          fromPartial({
            dealId: "deal-1",
            title: "iPhone 15 Pro",
            link: "https://example.com/deal-1",
            price: "999",
            merchant: "Apple",
            searchTerm: "iphone",
            timestamp: now,
          }),
        ])
        .mockResolvedValueOnce([
          fromPartial({
            dealId: "deal-2",
            title: "MacBook Air",
            link: "https://example.com/deal-2",
            price: "1299",
            merchant: "Apple",
            searchTerm: "macbook",
            timestamp: now - 1000,
          }),
        ]);

      const request = new Request("http://localhost/dashboard/deals");
      const result = await loader({ request, params: {}, context: {} });

      expect(result.deals).toHaveLength(2);
      expect(result.deals[0].title).toBe("iPhone 15 Pro");
      expect(result.deals[1].title).toBe("MacBook Air");
      expect(result.searchTerms).toEqual(["iphone", "macbook"]);

      // Verify efficient queries were made (not scans)
      expect(mockGetDealsBySearchTerm).toHaveBeenCalledTimes(2);
      expect(mockGetDealsBySearchTerm).toHaveBeenCalledWith(
        expect.objectContaining({ searchTerm: "iphone" })
      );
      expect(mockGetDealsBySearchTerm).toHaveBeenCalledWith(
        expect.objectContaining({ searchTerm: "macbook" })
      );
    });

    it("filters by specific search term when provided", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetConfigsByUser.mockResolvedValue([
        fromPartial({ searchTerm: "iphone" }),
        fromPartial({ searchTerm: "macbook" }),
      ]);

      const now = Date.now();
      mockGetDealsBySearchTerm.mockResolvedValue([
        fromPartial({
          dealId: "deal-1",
          title: "iPhone 15 Pro",
          link: "https://example.com/deal-1",
          price: "999",
          merchant: "Apple",
          searchTerm: "iphone",
          timestamp: now,
        }),
      ]);

      const request = new Request("http://localhost/dashboard/deals?searchTerm=iphone");
      const result = await loader({ request, params: {}, context: {} });

      expect(result.deals).toHaveLength(1);
      expect(result.deals[0].searchTerm).toBe("iphone");

      // Should only query for the specific search term
      expect(mockGetDealsBySearchTerm).toHaveBeenCalledTimes(1);
      expect(mockGetDealsBySearchTerm).toHaveBeenCalledWith(
        expect.objectContaining({ searchTerm: "iphone" })
      );
    });

    it("applies date range filter to queries", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetConfigsByUser.mockResolvedValue([
        fromPartial({ searchTerm: "iphone" }),
      ]);

      mockGetDealsBySearchTerm.mockResolvedValue([]);

      const request = new Request("http://localhost/dashboard/deals?dateRange=today");
      await loader({ request, params: {}, context: {} });

      // Verify startTime is passed for date filtering
      expect(mockGetDealsBySearchTerm).toHaveBeenCalledWith(
        expect.objectContaining({
          searchTerm: "iphone",
          startTime: expect.any(Number),
        })
      );
    });

    it("returns default dateRange of 7days when not specified", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetConfigsByUser.mockResolvedValue([
        fromPartial({ searchTerm: "iphone" }),
      ]);

      mockGetDealsBySearchTerm.mockResolvedValue([]);

      const request = new Request("http://localhost/dashboard/deals");
      const result = await loader({ request, params: {}, context: {} });

      expect(result.dateRange).toBe("7days");
    });

    it("returns empty deals when user has no configs", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetConfigsByUser.mockResolvedValue([]);

      const request = new Request("http://localhost/dashboard/deals");
      const result = await loader({ request, params: {}, context: {} });

      expect(result.deals).toHaveLength(0);
      expect(result.searchTerms).toEqual([]);
      // Should not query for deals when no search terms
      expect(mockGetDealsBySearchTerm).not.toHaveBeenCalled();
    });

    it("calculates stats correctly", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetConfigsByUser.mockResolvedValue([
        fromPartial({ searchTerm: "iphone" }),
      ]);

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      mockGetDealsBySearchTerm.mockResolvedValue([
        fromPartial({
          dealId: "deal-1",
          title: "iPhone 15 Pro",
          link: "https://example.com/deal-1",
          price: "999",
          merchant: "Apple",
          searchTerm: "iphone",
          timestamp: startOfDay.getTime() + 1000,
        }),
        fromPartial({
          dealId: "deal-2",
          title: "iPhone 14",
          link: "https://example.com/deal-2",
          price: "799",
          merchant: "Apple",
          searchTerm: "iphone",
          timestamp: startOfDay.getTime() - 86400000,
        }),
      ]);

      const request = new Request("http://localhost/dashboard/deals");
      const result = await loader({ request, params: {}, context: {} });

      expect(result.stats.dealsToday).toBe(1);
      expect(result.stats.topSearchTerm).toBe("iphone");
    });

    it("limits deals to 50 and sets hasMore flag", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetConfigsByUser.mockResolvedValue([
        fromPartial({ searchTerm: "iphone" }),
      ]);

      const deals = Array.from({ length: 60 }, (_, i) =>
        fromPartial({
          dealId: `deal-${i}`,
          title: `iPhone ${i}`,
          link: `https://example.com/deal-${i}`,
          price: "999",
          merchant: "Apple",
          searchTerm: "iphone",
          timestamp: Date.now() - i * 1000,
        })
      );

      mockGetDealsBySearchTerm.mockResolvedValue(deals);

      const request = new Request("http://localhost/dashboard/deals");
      const result = await loader({ request, params: {}, context: {} });

      expect(result.deals).toHaveLength(50);
      expect(result.hasMore).toBe(true);
    });

    it("throws redirect when user is not authenticated", async () => {
      mockRequireUser.mockRejectedValue(
        new Response(null, {
          status: 302,
          headers: { Location: "/auth/login" },
        })
      );

      const request = new Request("http://localhost/dashboard/deals");

      await expect(loader({ request, params: {}, context: {} })).rejects.toThrow();
    });
  });
});
