import { describe, it, expect, vi, beforeEach } from "vitest";
import { redirect } from "react-router";
import { getUser, requireUser, requireAnonymous, requireAdmin } from "./helpers.server";

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

vi.mock("./client.server", () => ({
  authClient: {
    verify: vi.fn(),
  },
}));

vi.mock("./session.server", () => ({
  getSession: vi.fn(),
  createAuthSession: vi.fn(),
}));

vi.mock("../../../functions/subjects", () => ({
  subjects: { user: {} },
}));

vi.mock("~/db/repository.server", () => ({
  isUserAdmin: vi.fn(),
}));

// Import mocks for assertions
import { authClient } from "./client.server";
import { getSession, createAuthSession } from "./session.server";
import { isUserAdmin } from "~/db/repository.server";

const mockAuthClient = vi.mocked(authClient);
const mockGetSession = vi.mocked(getSession);
const mockCreateAuthSession = vi.mocked(createAuthSession);
const mockIsUserAdmin = vi.mocked(isUserAdmin);
const mockRedirect = vi.mocked(redirect);

describe("Auth Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUser", () => {
    it("returns null when no access token in session", async () => {
      const mockSession = {
        get: vi.fn((key: string) => {
          if (key === "accessToken") return undefined;
          if (key === "refreshToken") return "refresh-token";
          return undefined;
        }),
      };
      mockGetSession.mockResolvedValue(mockSession as any);

      const request = new Request("http://localhost/dashboard");
      const result = await getUser(request);

      expect(result).toBeNull();
      expect(mockAuthClient.verify).not.toHaveBeenCalled();
    });

    it("returns null when no refresh token in session", async () => {
      const mockSession = {
        get: vi.fn((key: string) => {
          if (key === "accessToken") return "access-token";
          if (key === "refreshToken") return undefined;
          return undefined;
        }),
      };
      mockGetSession.mockResolvedValue(mockSession as any);

      const request = new Request("http://localhost/dashboard");
      const result = await getUser(request);

      expect(result).toBeNull();
      expect(mockAuthClient.verify).not.toHaveBeenCalled();
    });

    it("returns null when token verification fails", async () => {
      const mockSession = {
        get: vi.fn((key: string) => {
          if (key === "accessToken") return "access-token";
          if (key === "refreshToken") return "refresh-token";
          return undefined;
        }),
      };
      mockGetSession.mockResolvedValue(mockSession as any);
      mockAuthClient.verify.mockResolvedValue({ err: new Error("Invalid token") } as any);

      const request = new Request("http://localhost/dashboard");
      const result = await getUser(request);

      expect(result).toBeNull();
    });

    it("returns user without headers when tokens are valid and not refreshed", async () => {
      const mockSession = {
        get: vi.fn((key: string) => {
          if (key === "accessToken") return "access-token";
          if (key === "refreshToken") return "refresh-token";
          return undefined;
        }),
      };
      mockGetSession.mockResolvedValue(mockSession as any);
      mockAuthClient.verify.mockResolvedValue({
        err: false,
        tokens: undefined,
        subject: {
          properties: { id: "user-123", username: "testuser" },
        },
      } as any);

      const request = new Request("http://localhost/dashboard");
      const result = await getUser(request);

      expect(result).toEqual({
        user: { id: "user-123", username: "testuser" },
        headers: undefined,
      });
    });

    it("returns user with Set-Cookie header when tokens are refreshed", async () => {
      const mockSession = {
        get: vi.fn((key: string) => {
          if (key === "accessToken") return "access-token";
          if (key === "refreshToken") return "refresh-token";
          return undefined;
        }),
      };
      mockGetSession.mockResolvedValue(mockSession as any);
      mockAuthClient.verify.mockResolvedValue({
        err: false,
        tokens: { access: "new-access-token", refresh: "new-refresh-token" },
        subject: {
          properties: { id: "user-123", username: "testuser" },
        },
      } as any);
      mockCreateAuthSession.mockResolvedValue("session-cookie-value");

      const request = new Request("http://localhost/dashboard");
      const result = await getUser(request);

      expect(result).toEqual({
        user: { id: "user-123", username: "testuser" },
        headers: { "Set-Cookie": "session-cookie-value" },
      });
      expect(mockCreateAuthSession).toHaveBeenCalledWith(
        "new-access-token",
        "new-refresh-token"
      );
    });
  });

  describe("requireUser", () => {
    it("throws redirect to login when user is not authenticated", async () => {
      const mockSession = {
        get: vi.fn(() => undefined),
      };
      mockGetSession.mockResolvedValue(mockSession as any);

      const request = new Request("http://localhost/dashboard/channels");

      await expect(requireUser(request)).rejects.toThrow();
      expect(mockRedirect).toHaveBeenCalledWith(
        "/auth/login?redirectTo=%2Fdashboard%2Fchannels"
      );
    });

    it("preserves query params in redirect URL", async () => {
      const mockSession = {
        get: vi.fn(() => undefined),
      };
      mockGetSession.mockResolvedValue(mockSession as any);

      const request = new Request("http://localhost/dashboard/deals?search=test");

      await expect(requireUser(request)).rejects.toThrow();
      expect(mockRedirect).toHaveBeenCalledWith(
        "/auth/login?redirectTo=%2Fdashboard%2Fdeals%3Fsearch%3Dtest"
      );
    });

    it("returns user when authenticated", async () => {
      const mockSession = {
        get: vi.fn((key: string) => {
          if (key === "accessToken") return "access-token";
          if (key === "refreshToken") return "refresh-token";
          return undefined;
        }),
      };
      mockGetSession.mockResolvedValue(mockSession as any);
      mockAuthClient.verify.mockResolvedValue({
        err: false,
        tokens: undefined,
        subject: {
          properties: { id: "user-123", username: "testuser" },
        },
      } as any);

      const request = new Request("http://localhost/dashboard");
      const result = await requireUser(request);

      expect(result).toEqual({
        user: { id: "user-123", username: "testuser" },
        headers: undefined,
      });
    });
  });

  describe("requireAnonymous", () => {
    it("does not throw when user is not authenticated", async () => {
      const mockSession = {
        get: vi.fn(() => undefined),
      };
      mockGetSession.mockResolvedValue(mockSession as any);

      const request = new Request("http://localhost/auth/login");

      await expect(requireAnonymous(request)).resolves.toBeUndefined();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("throws redirect to dashboard when user is authenticated", async () => {
      const mockSession = {
        get: vi.fn((key: string) => {
          if (key === "accessToken") return "access-token";
          if (key === "refreshToken") return "refresh-token";
          return undefined;
        }),
      };
      mockGetSession.mockResolvedValue(mockSession as any);
      mockAuthClient.verify.mockResolvedValue({
        err: false,
        tokens: undefined,
        subject: {
          properties: { id: "user-123", username: "testuser" },
        },
      } as any);

      const request = new Request("http://localhost/auth/login");

      await expect(requireAnonymous(request)).rejects.toThrow();
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("requireAdmin", () => {
    it("throws redirect to login when user is not authenticated", async () => {
      const mockSession = {
        get: vi.fn(() => undefined),
      };
      mockGetSession.mockResolvedValue(mockSession as any);

      const request = new Request("http://localhost/dashboard/admin");

      await expect(requireAdmin(request)).rejects.toThrow();
      expect(mockRedirect).toHaveBeenCalledWith(
        "/auth/login?redirectTo=%2Fdashboard%2Fadmin"
      );
    });

    it("throws redirect to dashboard when user is not admin", async () => {
      const mockSession = {
        get: vi.fn((key: string) => {
          if (key === "accessToken") return "access-token";
          if (key === "refreshToken") return "refresh-token";
          return undefined;
        }),
      };
      mockGetSession.mockResolvedValue(mockSession as any);
      mockAuthClient.verify.mockResolvedValue({
        err: false,
        tokens: undefined,
        subject: {
          properties: { id: "user-123", username: "testuser" },
        },
      } as any);
      mockIsUserAdmin.mockResolvedValue(false);

      const request = new Request("http://localhost/dashboard/admin");

      await expect(requireAdmin(request)).rejects.toThrow();
      expect(mockIsUserAdmin).toHaveBeenCalledWith({ discordId: "user-123" });
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });

    it("returns user when authenticated and is admin", async () => {
      const mockSession = {
        get: vi.fn((key: string) => {
          if (key === "accessToken") return "access-token";
          if (key === "refreshToken") return "refresh-token";
          return undefined;
        }),
      };
      mockGetSession.mockResolvedValue(mockSession as any);
      mockAuthClient.verify.mockResolvedValue({
        err: false,
        tokens: undefined,
        subject: {
          properties: { id: "admin-123", username: "adminuser" },
        },
      } as any);
      mockIsUserAdmin.mockResolvedValue(true);

      const request = new Request("http://localhost/dashboard/admin");
      const result = await requireAdmin(request);

      expect(result).toEqual({
        user: { id: "admin-123", username: "adminuser" },
        headers: undefined,
      });
      expect(mockIsUserAdmin).toHaveBeenCalledWith({ discordId: "admin-123" });
    });
  });
});
