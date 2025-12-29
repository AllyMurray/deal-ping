import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import { render } from "~/test-utils";
import { SearchTermsPage, type SearchTermWithChannel } from "./SearchTermsPage";

const mockSearchTerms: SearchTermWithChannel[] = [
  {
    searchTerm: "gaming laptop",
    channelId: "channel-1",
    channelName: "Gaming Deals",
    enabled: true,
    includeKeywords: ["rtx", "nvidia"],
    excludeKeywords: ["refurbished"],
    maxPrice: 100000, // £1000.00
    minDiscount: undefined,
  },
  {
    searchTerm: "headphones",
    channelId: "channel-1",
    channelName: "Gaming Deals",
    enabled: true,
    includeKeywords: [],
    excludeKeywords: [],
    maxPrice: undefined,
    minDiscount: 30,
  },
  {
    searchTerm: "monitor",
    channelId: "channel-2",
    channelName: "Tech Deals",
    enabled: false,
    includeKeywords: [],
    excludeKeywords: ["curved"],
    maxPrice: undefined,
    minDiscount: undefined,
  },
];

const defaultProps = {
  searchTerms: mockSearchTerms,
};

describe("SearchTermsPage", () => {
  describe("rendering", () => {
    it("renders the page container", () => {
      render(<SearchTermsPage {...defaultProps} />);
      expect(screen.getByTestId("search-terms-page")).toBeInTheDocument();
    });

    it("renders the page title", () => {
      render(<SearchTermsPage {...defaultProps} />);
      expect(screen.getByTestId("page-title")).toHaveTextContent("Search Terms");
    });

    it("shows correct count in subtitle", () => {
      render(<SearchTermsPage {...defaultProps} />);
      // 2 enabled across 2 channels
      expect(screen.getByText(/2 active across 2 channels/)).toBeInTheDocument();
    });
  });

  describe("search terms table", () => {
    it("renders search terms table when terms exist", () => {
      render(<SearchTermsPage {...defaultProps} />);
      expect(screen.getByTestId("search-terms-table")).toBeInTheDocument();
    });

    it("renders rows for each search term", () => {
      render(<SearchTermsPage {...defaultProps} />);
      expect(screen.getByTestId("search-term-row-gaming laptop")).toBeInTheDocument();
      expect(screen.getByTestId("search-term-row-headphones")).toBeInTheDocument();
      expect(screen.getByTestId("search-term-row-monitor")).toBeInTheDocument();
    });

    it("displays search term names", () => {
      render(<SearchTermsPage {...defaultProps} />);
      expect(screen.getByText("gaming laptop")).toBeInTheDocument();
      expect(screen.getByText("headphones")).toBeInTheDocument();
      expect(screen.getByText("monitor")).toBeInTheDocument();
    });

    it("displays channel names as links", () => {
      render(<SearchTermsPage {...defaultProps} />);
      const gamingDealsLinks = screen.getAllByRole("link", { name: "Gaming Deals" });
      expect(gamingDealsLinks.length).toBe(2); // Two terms in Gaming Deals
      expect(screen.getByRole("link", { name: "Tech Deals" })).toBeInTheDocument();
    });

    it("displays enabled status correctly", () => {
      render(<SearchTermsPage {...defaultProps} />);
      const activeLabels = screen.getAllByText("Active");
      expect(activeLabels.length).toBe(2);
      expect(screen.getByText("Paused")).toBeInTheDocument();
    });
  });

  describe("filters display", () => {
    it("shows include keywords badge when present", () => {
      render(<SearchTermsPage {...defaultProps} />);
      expect(screen.getByText("+2 include")).toBeInTheDocument();
    });

    it("shows exclude keywords badge when present", () => {
      render(<SearchTermsPage {...defaultProps} />);
      // Two search terms have exclude keywords (gaming laptop and monitor)
      const excludeBadges = screen.getAllByText("-1 exclude");
      expect(excludeBadges.length).toBe(2);
    });

    it("shows max price badge when set", () => {
      render(<SearchTermsPage {...defaultProps} />);
      expect(screen.getByText("£1000.00")).toBeInTheDocument();
    });

    it("shows min discount badge when set", () => {
      render(<SearchTermsPage {...defaultProps} />);
      expect(screen.getByText("30%+")).toBeInTheDocument();
    });

    it("shows no filters text when no filters are set", () => {
      const termsWithNoFilters: SearchTermWithChannel[] = [
        {
          searchTerm: "simple",
          channelId: "channel-1",
          channelName: "Test",
          enabled: true,
          includeKeywords: [],
          excludeKeywords: [],
          maxPrice: undefined,
          minDiscount: undefined,
        },
      ];
      render(<SearchTermsPage searchTerms={termsWithNoFilters} />);
      expect(screen.getByText("No filters")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty state when no search terms", () => {
      render(<SearchTermsPage searchTerms={[]} />);
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    });

    it("shows appropriate empty state message", () => {
      render(<SearchTermsPage searchTerms={[]} />);
      expect(screen.getByText("No search terms yet")).toBeInTheDocument();
    });

    it("does not show empty state when terms exist", () => {
      render(<SearchTermsPage {...defaultProps} />);
      expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
    });
  });

  describe("channel links", () => {
    it("links to correct channel detail page", () => {
      render(<SearchTermsPage {...defaultProps} />);
      const gamingDealsLink = screen.getAllByRole("link", { name: "Gaming Deals" })[0];
      expect(gamingDealsLink).toHaveAttribute("href", "/dashboard/channels/channel-1");
    });
  });
});
