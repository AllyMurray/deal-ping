import { describe, it, expect, vi, beforeEach } from "vitest";
import { fromPartial } from "@total-typescript/shoehorn";
import { loader } from "./callback";

// Mock dependencies
vi.mock("react-router", () => ({
  redirect: vi.fn((url: string, options?: { headers?: Record<string, string> }) => {
    const error = new Response(null, {
      status: 302,
      headers: { Location: url, ...options?.headers },
    });
    throw error;
  }),
}));

vi.mock("~/lib/auth/client.server", () => ({
  authClient: {
    exchange: vi.fn(),
    verify: vi.fn(),
  },
}));

vi.mock("~/lib/auth/session.server", () => ({
  createAuthSession: vi.fn(),
}));

vi.mock("functions/subjects", () => ({
  subjects: { user: {} },
}));

vi.mock("~/db/repository.server", () => ({
  isUserAllowed: vi.fn(),
  getAllowedUser: vi.fn(),
  addAllowedUser: vi.fn(),
  updateAllowedUserAdmin: vi.fn(),
  updateAllowedUserProfile: vi.fn(),
}));

vi.mock("sst", () => ({
  Resource: {
    AdminDiscordId: { value: "admin-discord-id" },
  },
}));

// Import mocks for assertions
import { redirect } from "react-router";
import { authClient } from "~/lib/auth/client.server";
import { createAuthSession } from "~/lib/auth/session.server";
import {
  isUserAllowed,
  getAllowedUser,
  addAllowedUser,
  updateAllowedUserAdmin,
  updateAllowedUserProfile,
} from "~/db/repository.server";

const mockRedirect = vi.mocked(redirect);
const mockAuthClient = vi.mocked(authClient);
const mockCreateAuthSession = vi.mocked(createAuthSession);
const mockIsUserAllowed = vi.mocked(isUserAllowed);
const mockGetAllowedUser = vi.mocked(getAllowedUser);
const mockAddAllowedUser = vi.mocked(addAllowedUser);
const mockUpdateAllowedUserAdmin = vi.mocked(updateAllowedUserAdmin);
const mockUpdateAllowedUserProfile = vi.mocked(updateAllowedUserProfile);

describe("Auth Callback Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loader", () => {
    it("redirects to error page when OAuth error is present", async () => {
      const request = new Request(
        "http://localhost/auth/callback?error=access_denied&error_description=User+denied+access"
      );

      await expect(loader(fromPartial({ request, params: {}, context: {} }))).rejects.toThrow();
      expect(mockRedirect).toHaveBeenCalledWith("/?error=auth_failed");
    });

    it("redirects to error page when no code is provided", async () => {
      const request = new Request("http://localhost/auth/callback");

      await expect(loader(fromPartial({ request, params: {}, context: {} }))).rejects.toThrow();
      expect(mockRedirect).toHaveBeenCalledWith("/?error=auth_failed");
    });

    it("redirects to error page when token exchange fails", async () => {
      mockAuthClient.exchange.mockResolvedValue({
        err: new Error("Exchange failed"),
      } as any);

      const request = new Request("http://localhost/auth/callback?code=test-code");

      await expect(loader(fromPartial({ request, params: {}, context: {} }))).rejects.toThrow();
      expect(mockRedirect).toHaveBeenCalledWith("/?error=auth_failed");
    });

    it("redirects to error page when token verification fails", async () => {
      mockAuthClient.exchange.mockResolvedValue({
        err: false,
        tokens: { access: "access-token", refresh: "refresh-token" },
      } as any);

      mockAuthClient.verify.mockResolvedValue({
        err: new Error("Verification failed"),
      } as any);

      const request = new Request("http://localhost/auth/callback?code=test-code");

      await expect(loader(fromPartial({ request, params: {}, context: {} }))).rejects.toThrow();
      expect(mockRedirect).toHaveBeenCalledWith("/?error=auth_failed");
    });

    it("redirects to error page when user is not allowed", async () => {
      mockAuthClient.exchange.mockResolvedValue({
        err: false,
        tokens: { access: "access-token", refresh: "refresh-token" },
      } as any);

      mockAuthClient.verify.mockResolvedValue({
        err: false,
        subject: {
          properties: { id: "user-123", username: "testuser", avatar: "avatar.png" },
        },
      } as any);

      mockIsUserAllowed.mockResolvedValue(false);

      const request = new Request("http://localhost/auth/callback?code=test-code");

      await expect(loader(fromPartial({ request, params: {}, context: {} }))).rejects.toThrow();
      expect(mockRedirect).toHaveBeenCalledWith("/?error=not_allowed");
    });

    it("creates session and redirects to dashboard on success", async () => {
      mockAuthClient.exchange.mockResolvedValue({
        err: false,
        tokens: { access: "access-token", refresh: "refresh-token" },
      } as any);

      mockAuthClient.verify.mockResolvedValue({
        err: false,
        subject: {
          properties: { id: "user-123", username: "testuser", avatar: "avatar.png" },
        },
      } as any);

      mockIsUserAllowed.mockResolvedValue(true);
      mockCreateAuthSession.mockResolvedValue("session-cookie");
      mockUpdateAllowedUserProfile.mockResolvedValue(undefined);

      const request = new Request("http://localhost/auth/callback?code=test-code");

      await expect(loader(fromPartial({ request, params: {}, context: {} }))).rejects.toThrow();

      expect(mockCreateAuthSession).toHaveBeenCalledWith("access-token", "refresh-token");
      expect(mockUpdateAllowedUserProfile).toHaveBeenCalledWith({
        discordId: "user-123",
        username: "testuser",
        avatar: "avatar.png",
      });
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard", {
        headers: { "Set-Cookie": "session-cookie" },
      });
    });

    it("redirects to custom redirectTo on success", async () => {
      mockAuthClient.exchange.mockResolvedValue({
        err: false,
        tokens: { access: "access-token", refresh: "refresh-token" },
      } as any);

      mockAuthClient.verify.mockResolvedValue({
        err: false,
        subject: {
          properties: { id: "user-123", username: "testuser", avatar: "avatar.png" },
        },
      } as any);

      mockIsUserAllowed.mockResolvedValue(true);
      mockCreateAuthSession.mockResolvedValue("session-cookie");
      mockUpdateAllowedUserProfile.mockResolvedValue(undefined);

      const request = new Request(
        "http://localhost/auth/callback?code=test-code&redirectTo=/dashboard/channels"
      );

      await expect(loader(fromPartial({ request, params: {}, context: {} }))).rejects.toThrow();

      expect(mockRedirect).toHaveBeenCalledWith("/dashboard/channels", {
        headers: { "Set-Cookie": "session-cookie" },
      });
    });

    it("adds configured admin to allowlist if not present", async () => {
      mockAuthClient.exchange.mockResolvedValue({
        err: false,
        tokens: { access: "access-token", refresh: "refresh-token" },
      } as any);

      mockAuthClient.verify.mockResolvedValue({
        err: false,
        subject: {
          properties: { id: "admin-discord-id", username: "admin", avatar: "avatar.png" },
        },
      } as any);

      mockGetAllowedUser.mockResolvedValue(null);
      mockAddAllowedUser.mockResolvedValue({
        discordId: "admin-discord-id",
        isAdmin: true,
        addedBy: "system",
        quietHoursEnabled: false,
      });
      mockIsUserAllowed.mockResolvedValue(true);
      mockCreateAuthSession.mockResolvedValue("session-cookie");
      mockUpdateAllowedUserProfile.mockResolvedValue(undefined as any);

      const request = new Request("http://localhost/auth/callback?code=test-code");

      await expect(loader(fromPartial({ request, params: {}, context: {} }))).rejects.toThrow();

      expect(mockAddAllowedUser).toHaveBeenCalledWith({
        discordId: "admin-discord-id",
        addedBy: "system",
        isAdmin: true,
      });
    });

    it("upgrades existing user to admin if configured admin", async () => {
      mockAuthClient.exchange.mockResolvedValue({
        err: false,
        tokens: { access: "access-token", refresh: "refresh-token" },
      } as any);

      mockAuthClient.verify.mockResolvedValue({
        err: false,
        subject: {
          properties: { id: "admin-discord-id", username: "admin", avatar: "avatar.png" },
        },
      } as any);

      mockGetAllowedUser.mockResolvedValue(
        fromPartial({
          discordId: "admin-discord-id",
          isAdmin: false,
        })
      );
      mockUpdateAllowedUserAdmin.mockResolvedValue(undefined);
      mockIsUserAllowed.mockResolvedValue(true);
      mockCreateAuthSession.mockResolvedValue("session-cookie");
      mockUpdateAllowedUserProfile.mockResolvedValue(undefined);

      const request = new Request("http://localhost/auth/callback?code=test-code");

      await expect(loader(fromPartial({ request, params: {}, context: {} }))).rejects.toThrow();

      expect(mockUpdateAllowedUserAdmin).toHaveBeenCalledWith({
        discordId: "admin-discord-id",
        isAdmin: true,
      });
    });
  });
});
