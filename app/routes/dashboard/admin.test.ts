import { describe, it, expect, vi, beforeEach } from "vitest";
import { fromPartial } from "@total-typescript/shoehorn";
import { loader } from "./admin";

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

vi.mock("~/lib/auth/helpers.server", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("~/db/repository.server", () => ({
  getAllowedUsers: vi.fn(),
}));

// Import mocks for assertions
import { requireAdmin } from "~/lib/auth/helpers.server";
import { getAllowedUsers } from "~/db/repository.server";

const mockRequireAdmin = vi.mocked(requireAdmin);
const mockGetAllowedUsers = vi.mocked(getAllowedUsers);

describe("Admin Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loader", () => {
    it("returns users list for admin", async () => {
      mockRequireAdmin.mockResolvedValue(
        fromPartial({
          user: { id: "admin-123", username: "admin" },
        })
      );

      mockGetAllowedUsers.mockResolvedValue([
        {
          discordId: "user-1",
          username: "testuser1",
          avatar: "avatar1.png",
          isAdmin: false,
          addedBy: "admin-123",
          addedAt: new Date().toISOString(),
        },
        {
          discordId: "admin-123",
          username: "admin",
          avatar: "admin-avatar.png",
          isAdmin: true,
          addedBy: "system",
          addedAt: new Date().toISOString(),
        },
      ]);

      const request = new Request("http://localhost/dashboard/admin");
      const result = await loader({ request, params: {}, context: {} });

      expect(result.users).toHaveLength(2);
      expect(result.users[0]).toEqual({
        discordId: "user-1",
        username: "testuser1",
        avatar: "avatar1.png",
        isAdmin: false,
        addedBy: "admin-123",
        addedAt: expect.any(String),
      });
      expect(result.currentUserId).toBe("admin-123");
    });

    it("returns empty list when no users", async () => {
      mockRequireAdmin.mockResolvedValue(
        fromPartial({
          user: { id: "admin-123", username: "admin" },
        })
      );

      mockGetAllowedUsers.mockResolvedValue([]);

      const request = new Request("http://localhost/dashboard/admin");
      const result = await loader({ request, params: {}, context: {} });

      expect(result.users).toEqual([]);
      expect(result.currentUserId).toBe("admin-123");
    });

    it("throws redirect when user is not authenticated", async () => {
      mockRequireAdmin.mockRejectedValue(
        new Response(null, {
          status: 302,
          headers: { Location: "/auth/login" },
        })
      );

      const request = new Request("http://localhost/dashboard/admin");

      await expect(loader({ request, params: {}, context: {} })).rejects.toThrow();
    });

    it("throws redirect when user is not admin", async () => {
      mockRequireAdmin.mockRejectedValue(
        new Response(null, {
          status: 302,
          headers: { Location: "/dashboard" },
        })
      );

      const request = new Request("http://localhost/dashboard/admin");

      await expect(loader({ request, params: {}, context: {} })).rejects.toThrow();
    });
  });
});
