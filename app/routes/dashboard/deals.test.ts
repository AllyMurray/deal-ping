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
}));

vi.mock("../../../src/db/service", () => ({
  HotUKDealsService: {
    entities: {
      deal: {
        scan: {
          go: vi.fn(),
        },
      },
    },
  },
}));

// Import mocks for assertions
import { requireUser } from "~/lib/auth";
import { getConfigsByUser } from "~/db/repository.server";
import { HotUKDealsService } from "../../../src/db/service";

const mockRequireUser = vi.mocked(requireUser);
const mockGetConfigsByUser = vi.mocked(getConfigsByUser);
const mockDealScan = vi.mocked(HotUKDealsService.entities.deal.scan.go);

describe("Deals Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loader", () => {
    it("returns deals filtered by user search terms", async () => {
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
      mockDealScan.mockResolvedValue({
        data: [
          {
            dealId: "deal-1",
            title: "iPhone 15 Pro",
            link: "https://example.com/deal-1",
            price: "999",
            merchant: "Apple",
            searchTerm: "iphone",
            timestamp: now,
          },
          {
            dealId: "deal-2",
            title: "MacBook Air",
            link: "https://example.com/deal-2",
            price: "1299",
            merchant: "Apple",
            searchTerm: "macbook",
            timestamp: now - 1000,
          },
          {
            dealId: "deal-3",
            title: "Samsung Galaxy",
            link: "https://example.com/deal-3",
            price: "799",
            merchant: "Samsung",
            searchTerm: "samsung",
            timestamp: now - 2000,
          },
        ],
        cursor: null,
      });

      const request = new Request("http://localhost/dashboard/deals");
      const result = await loader({ request, params: {}, context: {} });

      expect(result.deals).toHaveLength(2);
      expect(result.deals[0].title).toBe("iPhone 15 Pro");
      expect(result.deals[1].title).toBe("MacBook Air");
      expect(result.searchTerms).toEqual(["iphone", "macbook"]);
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
      mockDealScan.mockResolvedValue({
        data: [
          {
            dealId: "deal-1",
            title: "iPhone 15 Pro",
            link: "https://example.com/deal-1",
            price: "999",
            merchant: "Apple",
            searchTerm: "iphone",
            timestamp: now,
          },
          {
            dealId: "deal-2",
            title: "MacBook Air",
            link: "https://example.com/deal-2",
            price: "1299",
            merchant: "Apple",
            searchTerm: "macbook",
            timestamp: now - 1000,
          },
        ],
        cursor: null,
      });

      const request = new Request("http://localhost/dashboard/deals?searchTerm=iphone");
      const result = await loader({ request, params: {}, context: {} });

      expect(result.deals).toHaveLength(1);
      expect(result.deals[0].searchTerm).toBe("iphone");
    });

    it("returns empty deals when user has no configs", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetConfigsByUser.mockResolvedValue([]);

      mockDealScan.mockResolvedValue({
        data: [
          {
            dealId: "deal-1",
            title: "iPhone 15 Pro",
            link: "https://example.com/deal-1",
            price: "999",
            merchant: "Apple",
            searchTerm: "iphone",
            timestamp: Date.now(),
          },
        ],
        cursor: null,
      });

      const request = new Request("http://localhost/dashboard/deals");
      const result = await loader({ request, params: {}, context: {} });

      expect(result.deals).toHaveLength(0);
      expect(result.searchTerms).toEqual([]);
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

      const now = Date.now();
      const startOfDay = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate()
      ).getTime();

      mockDealScan.mockResolvedValue({
        data: [
          {
            dealId: "deal-1",
            title: "iPhone 15 Pro",
            link: "https://example.com/deal-1",
            price: "999",
            merchant: "Apple",
            searchTerm: "iphone",
            timestamp: startOfDay + 1000,
          },
          {
            dealId: "deal-2",
            title: "iPhone 14",
            link: "https://example.com/deal-2",
            price: "799",
            merchant: "Apple",
            searchTerm: "iphone",
            timestamp: startOfDay - 86400000,
          },
        ],
        cursor: null,
      });

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

      const deals = Array.from({ length: 60 }, (_, i) => ({
        dealId: `deal-${i}`,
        title: `iPhone ${i}`,
        link: `https://example.com/deal-${i}`,
        price: "999",
        merchant: "Apple",
        searchTerm: "iphone",
        timestamp: Date.now() - i * 1000,
      }));

      mockDealScan.mockResolvedValue({
        data: deals,
        cursor: null,
      });

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
