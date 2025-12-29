import { describe, it, expect, vi, beforeEach } from "vitest";
import { fromPartial } from "@total-typescript/shoehorn";
import { loader } from "./check-duplicates";

// Mock dependencies
vi.mock("~/lib/auth", () => ({
  requireUser: vi.fn(),
}));

vi.mock("~/db/repository.server", () => ({
  findDuplicateSearchTerms: vi.fn(),
}));

// Import mocks for assertions
import { requireUser } from "~/lib/auth";
import { findDuplicateSearchTerms } from "~/db/repository.server";

const mockRequireUser = vi.mocked(requireUser);
const mockFindDuplicateSearchTerms = vi.mocked(findDuplicateSearchTerms);

describe("Check Duplicates API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockResolvedValue(
      fromPartial({
        user: { id: "user-123", username: "testuser" },
      })
    );
  });

  describe("loader", () => {
    it("returns empty duplicates array when no duplicates found", async () => {
      mockFindDuplicateSearchTerms.mockResolvedValue([]);

      const request = new Request(
        "http://localhost/api/configs/check-duplicates?searchTerm=ps5&channelId=ch-1"
      );
      const response = await loader({
        request,
        params: {},
        context: {},
      });

      expect(response).toBeInstanceOf(Response);
      const data = await response.json();
      expect(data).toEqual({ duplicates: [] });
    });

    it("returns duplicates when found", async () => {
      mockFindDuplicateSearchTerms.mockResolvedValue([
        { channelId: "ch-2", channelName: "Gaming Deals" },
        { channelId: "ch-3", channelName: "Tech Bargains" },
      ]);

      const request = new Request(
        "http://localhost/api/configs/check-duplicates?searchTerm=ps5&channelId=ch-1"
      );
      const response = await loader({
        request,
        params: {},
        context: {},
      });

      const data = await response.json();
      expect(data.duplicates).toHaveLength(2);
      expect(data.duplicates[0]).toEqual({
        channelId: "ch-2",
        channelName: "Gaming Deals",
      });
      expect(data.duplicates[1]).toEqual({
        channelId: "ch-3",
        channelName: "Tech Bargains",
      });
    });

    it("returns error when searchTerm is missing", async () => {
      const request = new Request(
        "http://localhost/api/configs/check-duplicates"
      );
      const response = await loader({
        request,
        params: {},
        context: {},
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("searchTerm query parameter is required");
    });

    it("calls findDuplicateSearchTerms with correct params", async () => {
      mockFindDuplicateSearchTerms.mockResolvedValue([]);

      const request = new Request(
        "http://localhost/api/configs/check-duplicates?searchTerm=nintendo&channelId=ch-123"
      );
      await loader({
        request,
        params: {},
        context: {},
      });

      expect(mockFindDuplicateSearchTerms).toHaveBeenCalledWith({
        searchTerm: "nintendo",
        excludeChannelId: "ch-123",
        userId: "user-123",
      });
    });

    it("calls findDuplicateSearchTerms without channelId when not provided", async () => {
      mockFindDuplicateSearchTerms.mockResolvedValue([]);

      const request = new Request(
        "http://localhost/api/configs/check-duplicates?searchTerm=nintendo"
      );
      await loader({
        request,
        params: {},
        context: {},
      });

      expect(mockFindDuplicateSearchTerms).toHaveBeenCalledWith({
        searchTerm: "nintendo",
        excludeChannelId: undefined,
        userId: "user-123",
      });
    });

    it("trims search term before checking", async () => {
      mockFindDuplicateSearchTerms.mockResolvedValue([]);

      const request = new Request(
        "http://localhost/api/configs/check-duplicates?searchTerm=%20%20ps5%20%20"
      );
      await loader({
        request,
        params: {},
        context: {},
      });

      expect(mockFindDuplicateSearchTerms).toHaveBeenCalledWith({
        searchTerm: "ps5",
        excludeChannelId: undefined,
        userId: "user-123",
      });
    });
  });
});
