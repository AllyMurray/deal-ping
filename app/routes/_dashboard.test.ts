import { describe, it, expect, vi, beforeEach } from "vitest";
import { fromPartial } from "@total-typescript/shoehorn";
import { loader } from "./_dashboard";

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
  isUserAdmin: vi.fn(),
}));

// Import mocks for assertions
import { requireUser } from "~/lib/auth";
import { isUserAdmin } from "~/db/repository.server";

const mockRequireUser = vi.mocked(requireUser);
const mockIsUserAdmin = vi.mocked(isUserAdmin);

describe("Dashboard Layout Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loader", () => {
    it("returns user and isAdmin status for authenticated user", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
          headers: undefined,
        })
      );

      mockIsUserAdmin.mockResolvedValue(false);

      const request = new Request("http://localhost/dashboard");
      const response = await loader({ request, params: {}, context: {} });
      const result = await response.json();

      expect(result.user).toEqual({ id: "user-123", username: "testuser" });
      expect(result.isAdmin).toBe(false);
    });

    it("returns isAdmin true for admin users", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "admin-123", username: "admin" },
          headers: undefined,
        })
      );

      mockIsUserAdmin.mockResolvedValue(true);

      const request = new Request("http://localhost/dashboard");
      const response = await loader({ request, params: {}, context: {} });
      const result = await response.json();

      expect(result.user).toEqual({ id: "admin-123", username: "admin" });
      expect(result.isAdmin).toBe(true);
      expect(mockIsUserAdmin).toHaveBeenCalledWith({ discordId: "admin-123" });
    });

    it("passes through auth headers when present", async () => {
      mockRequireUser.mockResolvedValue(
        fromPartial({
          user: { id: "user-123", username: "testuser" },
          headers: { "Set-Cookie": "refreshed-session" },
        })
      );

      mockIsUserAdmin.mockResolvedValue(false);

      const request = new Request("http://localhost/dashboard");
      const response = await loader({ request, params: {}, context: {} });

      expect(response.headers.get("Set-Cookie")).toBe("refreshed-session");
    });

    it("throws redirect when user is not authenticated", async () => {
      mockRequireUser.mockRejectedValue(
        new Response(null, {
          status: 302,
          headers: { Location: "/auth/login?redirectTo=%2Fdashboard" },
        })
      );

      const request = new Request("http://localhost/dashboard");

      await expect(loader({ request, params: {}, context: {} })).rejects.toThrow();
    });
  });
});
