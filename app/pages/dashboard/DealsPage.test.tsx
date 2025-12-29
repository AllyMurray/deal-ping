import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "~/test-utils";
import { DealsPage } from "./DealsPage";

const mockDeals = [
  {
    id: "deal-1",
    title: "PlayStation 5 Console",
    link: "https://example.com/deal/1",
    price: "£399",
    merchant: "Amazon",
    searchTerm: "PS5",
    timestamp: Date.now(),
  },
  {
    id: "deal-2",
    title: "Xbox Series X",
    link: "https://example.com/deal/2",
    price: "£449",
    merchant: "Argos",
    searchTerm: "Xbox",
    timestamp: Date.now(),
  },
];

const mockStats = {
  totalDeals: 150,
  dealsToday: 12,
  topSearchTerm: "PS5",
};

const defaultProps = {
  deals: mockDeals,
  stats: mockStats,
  searchTerms: ["PS5", "Xbox", "Nintendo Switch"],
  selectedSearchTerm: null,
  onSearchTermChange: vi.fn(),
  searchQuery: "",
  onSearchQueryChange: vi.fn(),
  dateRange: "7days" as const,
  onDateRangeChange: vi.fn(),
  hasMore: false,
  onLoadMore: vi.fn(),
  isLoadingMore: false,
};

describe("DealsPage", () => {
  describe("rendering", () => {
    it("renders the page container", () => {
      render(<DealsPage {...defaultProps} />);
      expect(screen.getByTestId("deals-page")).toBeInTheDocument();
    });

    it("renders the page title", () => {
      render(<DealsPage {...defaultProps} />);
      expect(screen.getByTestId("page-title")).toHaveTextContent("Deal History");
    });

    it("renders page description", () => {
      render(<DealsPage {...defaultProps} />);
      expect(
        screen.getByText("View all processed deals with notification status and filter reasons")
      ).toBeInTheDocument();
    });
  });

  describe("stats display", () => {
    it("renders deal stats component", () => {
      render(<DealsPage {...defaultProps} />);
      expect(screen.getByTestId("deal-stats")).toBeInTheDocument();
    });

    it("displays total deals count", () => {
      render(<DealsPage {...defaultProps} />);
      expect(screen.getByTestId("total-deals")).toHaveTextContent("150");
    });

    it("displays deals today count", () => {
      render(<DealsPage {...defaultProps} />);
      expect(screen.getByTestId("deals-today")).toHaveTextContent("12");
    });

    it("displays top search term", () => {
      render(<DealsPage {...defaultProps} />);
      expect(screen.getByTestId("top-search-term")).toHaveTextContent("PS5");
    });
  });

  describe("filters", () => {
    it("renders deal filters component", () => {
      render(<DealsPage {...defaultProps} />);
      expect(screen.getByTestId("deal-filters")).toBeInTheDocument();
    });

    it("renders date range filter", () => {
      render(<DealsPage {...defaultProps} />);
      expect(screen.getByTestId("date-range-filter")).toBeInTheDocument();
    });

    it("renders search term filter", () => {
      render(<DealsPage {...defaultProps} />);
      expect(screen.getByTestId("search-term-filter")).toBeInTheDocument();
    });

    it("renders search query input", () => {
      render(<DealsPage {...defaultProps} />);
      expect(screen.getByTestId("search-query-input")).toBeInTheDocument();
    });
  });

  describe("deals list", () => {
    it("renders deals list when deals exist", () => {
      render(<DealsPage {...defaultProps} />);
      expect(screen.getByTestId("deals-list")).toBeInTheDocument();
    });

    it("renders deal cards for each deal", () => {
      render(<DealsPage {...defaultProps} />);
      expect(screen.getByTestId("deal-card-deal-1")).toBeInTheDocument();
      expect(screen.getByTestId("deal-card-deal-2")).toBeInTheDocument();
    });

    it("does not show load more button when hasMore is false", () => {
      render(<DealsPage {...defaultProps} />);
      expect(screen.queryByTestId("load-more-button")).not.toBeInTheDocument();
    });

    it("shows load more button when hasMore is true", () => {
      render(<DealsPage {...defaultProps} hasMore={true} />);
      expect(screen.getByTestId("load-more-button")).toBeInTheDocument();
    });

    it("calls onLoadMore when load more button clicked", async () => {
      const user = userEvent.setup();
      render(<DealsPage {...defaultProps} hasMore={true} />);
      await user.click(screen.getByTestId("load-more-button"));
      expect(defaultProps.onLoadMore).toHaveBeenCalled();
    });

    it("shows loading state on load more button", () => {
      render(<DealsPage {...defaultProps} hasMore={true} isLoadingMore={true} />);
      expect(screen.getByTestId("load-more-button")).toHaveAttribute(
        "data-loading",
        "true"
      );
    });
  });

  describe("empty state", () => {
    it("shows empty state when no deals", () => {
      render(<DealsPage {...defaultProps} deals={[]} />);
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    });

    it("shows default empty message when no filters applied", () => {
      render(<DealsPage {...defaultProps} deals={[]} />);
      expect(screen.getByTestId("empty-state-description")).toHaveTextContent(
        "Deals will appear here once the notifier processes them."
      );
    });

    it("shows filter hint when filters are applied", () => {
      render(
        <DealsPage
          {...defaultProps}
          deals={[]}
          selectedSearchTerm="PS5"
        />
      );
      expect(screen.getByTestId("empty-state-description")).toHaveTextContent(
        "Try adjusting your filters to see more deals."
      );
    });

    it("shows filter hint when search query is applied", () => {
      render(
        <DealsPage
          {...defaultProps}
          deals={[]}
          searchQuery="console"
        />
      );
      expect(screen.getByTestId("empty-state-description")).toHaveTextContent(
        "Try adjusting your filters to see more deals."
      );
    });

    it("does not show empty state when deals exist", () => {
      render(<DealsPage {...defaultProps} />);
      expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
    });
  });

  describe("filter visibility toggle", () => {
    const dealsWithFiltered = [
      {
        id: "deal-1",
        title: "PlayStation 5 Console",
        link: "https://example.com/deal/1",
        searchTerm: "PS5",
        filterStatus: "passed" as const,
      },
      {
        id: "deal-2",
        title: "Random Product",
        link: "https://example.com/deal/2",
        searchTerm: "PS5",
        filterStatus: "filtered_no_match" as const,
      },
      {
        id: "deal-3",
        title: "Refurbished Console",
        link: "https://example.com/deal/3",
        searchTerm: "PS5",
        filterStatus: "filtered_exclude" as const,
      },
    ];

    it("shows show filtered toggle when there are filtered deals", () => {
      render(
        <DealsPage
          {...defaultProps}
          deals={dealsWithFiltered}
          onShowFilteredChange={vi.fn()}
        />
      );
      expect(screen.getByTestId("show-filtered-toggle")).toBeInTheDocument();
    });

    it("does not show toggle when no filtered deals", () => {
      const allPassed = dealsWithFiltered.map(d => ({ ...d, filterStatus: "passed" as const }));
      render(
        <DealsPage
          {...defaultProps}
          deals={allPassed}
          onShowFilteredChange={vi.fn()}
        />
      );
      expect(screen.queryByTestId("show-filtered-toggle")).not.toBeInTheDocument();
    });

    it("shows filtered count badge", () => {
      render(
        <DealsPage
          {...defaultProps}
          deals={dealsWithFiltered}
          onShowFilteredChange={vi.fn()}
        />
      );
      expect(screen.getByText("2 filtered")).toBeInTheDocument();
    });

    it("hides filtered deals by default", () => {
      render(
        <DealsPage
          {...defaultProps}
          deals={dealsWithFiltered}
          showFiltered={false}
          onShowFilteredChange={vi.fn()}
        />
      );
      // Should only show the passed deal
      expect(screen.getByTestId("deal-card-deal-1")).toBeInTheDocument();
      expect(screen.queryByTestId("deal-card-deal-2")).not.toBeInTheDocument();
      expect(screen.queryByTestId("deal-card-deal-3")).not.toBeInTheDocument();
    });

    it("shows filtered deals when toggle is on", () => {
      render(
        <DealsPage
          {...defaultProps}
          deals={dealsWithFiltered}
          showFiltered={true}
          onShowFilteredChange={vi.fn()}
        />
      );
      // Should show all deals
      expect(screen.getByTestId("deal-card-deal-1")).toBeInTheDocument();
      expect(screen.getByTestId("deal-card-deal-2")).toBeInTheDocument();
      expect(screen.getByTestId("deal-card-deal-3")).toBeInTheDocument();
    });

    it("calls onShowFilteredChange when toggle is clicked", async () => {
      const user = userEvent.setup();
      const onShowFilteredChange = vi.fn();
      render(
        <DealsPage
          {...defaultProps}
          deals={dealsWithFiltered}
          showFiltered={false}
          onShowFilteredChange={onShowFilteredChange}
        />
      );
      await user.click(screen.getByTestId("show-filtered-toggle"));
      expect(onShowFilteredChange).toHaveBeenCalledWith(true);
    });

    it("shows appropriate empty message when all deals filtered", () => {
      const allFiltered = dealsWithFiltered.filter(d => d.filterStatus !== "passed");
      render(
        <DealsPage
          {...defaultProps}
          deals={allFiltered}
          showFiltered={false}
          onShowFilteredChange={vi.fn()}
        />
      );
      expect(screen.getByTestId("empty-state-description")).toHaveTextContent(
        "All deals were filtered out"
      );
    });
  });
});
