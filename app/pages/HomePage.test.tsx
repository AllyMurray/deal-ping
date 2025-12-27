import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "~/test-utils";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  describe("rendering", () => {
    it("renders the page container", () => {
      render(<HomePage isAuthenticated={false} />);
      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });

    it("renders the hero title", () => {
      render(<HomePage isAuthenticated={false} />);
      expect(screen.getByTestId("hero-title")).toHaveTextContent(
        "Never Miss a Hot Deal"
      );
    });

    it("renders feature cards", () => {
      render(<HomePage isAuthenticated={false} />);
      expect(screen.getByTestId("feature-multiple-channels")).toBeInTheDocument();
      expect(screen.getByTestId("feature-smart-filters")).toBeInTheDocument();
      expect(screen.getByTestId("feature-real-time-alerts")).toBeInTheDocument();
    });
  });

  describe("authentication state", () => {
    it("shows login button when not authenticated", () => {
      render(<HomePage isAuthenticated={false} />);
      expect(screen.getByTestId("login-button")).toBeInTheDocument();
      expect(screen.getByTestId("login-button")).toHaveTextContent(
        "Sign in with Discord"
      );
    });

    it("shows dashboard button when authenticated", () => {
      render(<HomePage isAuthenticated={true} />);
      expect(screen.getByTestId("dashboard-button")).toBeInTheDocument();
      expect(screen.getByTestId("dashboard-button")).toHaveTextContent(
        "Open Dashboard"
      );
    });
  });

  describe("error handling", () => {
    it("shows error alert when error is present", () => {
      render(<HomePage isAuthenticated={false} error="auth_failed" />);
      expect(screen.getByTestId("auth-error")).toBeInTheDocument();
    });

    it("does not show error alert when no error", () => {
      render(<HomePage isAuthenticated={false} />);
      expect(screen.queryByTestId("auth-error")).not.toBeInTheDocument();
    });
  });
});
