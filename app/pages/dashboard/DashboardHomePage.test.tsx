import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "~/test-utils";
import { DashboardHomePage } from "./DashboardHomePage";

const defaultStats = {
  channelCount: 3,
  configCount: 10,
  enabledConfigCount: 8,
  dealsToday: 5,
};

describe("DashboardHomePage", () => {
  describe("rendering", () => {
    it("renders the page container", () => {
      render(<DashboardHomePage stats={defaultStats} />);
      expect(screen.getByTestId("dashboard-home-page")).toBeInTheDocument();
    });

    it("renders the page title", () => {
      render(<DashboardHomePage stats={defaultStats} />);
      expect(screen.getByTestId("page-title")).toHaveTextContent("Command Centre");
    });
  });

  describe("stats display", () => {
    it("shows channel count", () => {
      render(<DashboardHomePage stats={defaultStats} />);
      expect(screen.getByTestId("stat-channels")).toHaveTextContent("3");
    });

    it("shows search term count", () => {
      render(<DashboardHomePage stats={defaultStats} />);
      expect(screen.getByTestId("stat-search-terms")).toHaveTextContent("10");
    });

    it("shows active count badge when some configs are disabled", () => {
      render(<DashboardHomePage stats={defaultStats} />);
      expect(screen.getByTestId("stat-search-terms")).toHaveTextContent(
        "8 active"
      );
    });

    it("shows 'all active' badge when all configs enabled", () => {
      render(
        <DashboardHomePage
          stats={{ ...defaultStats, enabledConfigCount: 10 }}
        />
      );
      expect(screen.getByTestId("stat-search-terms")).toHaveTextContent(
        "all active"
      );
    });

    it("shows deals today count", () => {
      render(<DashboardHomePage stats={defaultStats} />);
      expect(screen.getByTestId("stat-deals-today")).toHaveTextContent("5");
    });

    it("shows zero when no deals today", () => {
      render(
        <DashboardHomePage stats={{ ...defaultStats, dealsToday: 0 }} />
      );
      expect(screen.getByTestId("stat-deals-today")).toHaveTextContent("0");
    });
  });
});
