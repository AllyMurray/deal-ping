import { describe, it, expect, vi, beforeEach } from "vitest";
import { fromPartial } from "@total-typescript/shoehorn";
import { loader } from "./index";

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
  getConfigsByUser: vi.fn(),
}));

// Import mocks for assertions
import { requireUser } from "~/lib/auth";
import { getChannelsByUser, getConfigsByUser } from "~/db/repository.server";

const mockRequireUser = vi.mocked(requireUser);
const mockGetChannelsByUser = vi.mocked(getChannelsByUser);
const mockGetConfigsByUser = vi.mocked(getConfigsByUser);

describe("Dashboard Index Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loader", () => {
    it("returns dashboard stats for authenticated user", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetChannelsByUser.mockResolvedValue([
        fromPartial({ channelId: "ch-1" }),
        fromPartial({ channelId: "ch-2" }),
      ]);

      mockGetConfigsByUser.mockResolvedValue([
        fromPartial({ configId: "cfg-1", enabled: true }),
        fromPartial({ configId: "cfg-2", enabled: true }),
        fromPartial({ configId: "cfg-3", enabled: false }),
      ]);

      const request = new Request("http://localhost/dashboard");
      const result = await loader({ request, params: {}, context: {} });

      expect(result.stats).toEqual({
        channelCount: 2,
        configCount: 3,
        enabledConfigCount: 2,
      });
    });

    it("returns zero stats for new user", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetChannelsByUser.mockResolvedValue([]);
      mockGetConfigsByUser.mockResolvedValue([]);

      const request = new Request("http://localhost/dashboard");
      const result = await loader({ request, params: {}, context: {} });

      expect(result.stats).toEqual({
        channelCount: 0,
        configCount: 0,
        enabledConfigCount: 0,
      });
    });

    it("throws redirect when user is not authenticated", async () => {
      mockRequireUser.mockRejectedValue(
        new Response(null, {
          status: 302,
          headers: { Location: "/auth/login" },
        })
      );

      const request = new Request("http://localhost/dashboard");

      await expect(loader({ request, params: {}, context: {} })).rejects.toThrow();
    });

    it("fetches channels and configs in parallel", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
        })
      );

      mockGetChannelsByUser.mockResolvedValue([]);
      mockGetConfigsByUser.mockResolvedValue([]);

      const request = new Request("http://localhost/dashboard");
      await loader({ request, params: {}, context: {} });

      expect(mockGetChannelsByUser).toHaveBeenCalledWith({ userId: "user-123" });
      expect(mockGetConfigsByUser).toHaveBeenCalledWith({ userId: "user-123" });
    });
  });
});
