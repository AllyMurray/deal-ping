import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "~/test-utils";
import { DealFilters } from "./DealFilters";

const defaultProps = {
  searchTerms: ["PS5", "Xbox", "Nintendo Switch"],
  selectedSearchTerm: null,
  onSearchTermChange: vi.fn(),
  searchQuery: "",
  onSearchQueryChange: vi.fn(),
  dateRange: "7days" as const,
  onDateRangeChange: vi.fn(),
};

describe("DealFilters", () => {
  describe("rendering", () => {
    it("renders the filters container", () => {
      render(<DealFilters {...defaultProps} />);
      expect(screen.getByTestId("deal-filters")).toBeInTheDocument();
    });

    it("renders the date range filter", () => {
      render(<DealFilters {...defaultProps} />);
      expect(screen.getByTestId("date-range-filter")).toBeInTheDocument();
    });

    it("renders the search term filter", () => {
      render(<DealFilters {...defaultProps} />);
      expect(screen.getByTestId("search-term-filter")).toBeInTheDocument();
    });

    it("renders the search query input", () => {
      render(<DealFilters {...defaultProps} />);
      expect(screen.getByTestId("search-query-input")).toBeInTheDocument();
    });
  });

  describe("date range filter", () => {
    it("displays Last 7 days by default", () => {
      render(<DealFilters {...defaultProps} dateRange="7days" />);
      expect(screen.getByTestId("date-range-filter")).toHaveValue("Last 7 days");
    });

    it("displays Today when selected", () => {
      render(<DealFilters {...defaultProps} dateRange="today" />);
      expect(screen.getByTestId("date-range-filter")).toHaveValue("Today");
    });

    it("displays Last 30 days when selected", () => {
      render(<DealFilters {...defaultProps} dateRange="30days" />);
      expect(screen.getByTestId("date-range-filter")).toHaveValue("Last 30 days");
    });

    it("displays All time when selected", () => {
      render(<DealFilters {...defaultProps} dateRange="all" />);
      expect(screen.getByTestId("date-range-filter")).toHaveValue("All time");
    });
  });

  describe("search term filter", () => {
    it("shows All search terms when no search term selected", () => {
      render(<DealFilters {...defaultProps} selectedSearchTerm={null} />);
      expect(screen.getByTestId("search-term-filter")).toHaveValue("All search terms");
    });

    it("shows selected search term value", () => {
      render(<DealFilters {...defaultProps} selectedSearchTerm="PS5" />);
      expect(screen.getByTestId("search-term-filter")).toHaveValue("PS5");
    });
  });

  describe("search query input", () => {
    it("displays the current search query", () => {
      render(<DealFilters {...defaultProps} searchQuery="console" />);
      expect(screen.getByTestId("search-query-input")).toHaveValue("console");
    });

    it("shows empty value when no search query", () => {
      render(<DealFilters {...defaultProps} searchQuery="" />);
      expect(screen.getByTestId("search-query-input")).toHaveValue("");
    });
  });
});
