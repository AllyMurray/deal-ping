import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "~/test-utils";
import { DealCard } from "./DealCard";

const defaultProps = {
  id: "deal-123",
  title: "Steam Deck OLED 1TB - Best Price",
  link: "https://hotukdeals.com/deal/123",
  price: "£529.99",
  merchant: "Amazon",
  searchTerm: "steam-deck",
  timestamp: Date.now(),
};

const matchDetailsJson = JSON.stringify({
  searchText: "Steam Deck OLED 1TB - Best Price Amazon",
  matchedSegments: [
    { text: "...[Steam] Deck...", matchedTerm: "Steam", position: "title" },
    { text: "...Deck [OLED]...", matchedTerm: "OLED", position: "title" },
  ],
  searchTermMatches: ["Steam", "Deck"],
  includeKeywordMatches: ["OLED"],
  excludeKeywordStatus: "No excluded keywords found (checked: refurbished)",
  filterStatus: 'Matched "Steam", "Deck" from search term "steam-deck"',
});

describe("DealCard", () => {
  describe("rendering", () => {
    it("renders the card", () => {
      render(<DealCard {...defaultProps} />);
      expect(screen.getByTestId("deal-card-deal-123")).toBeInTheDocument();
    });

    it("displays deal title", () => {
      render(<DealCard {...defaultProps} />);
      expect(screen.getByTestId("deal-title")).toHaveTextContent(
        "Steam Deck OLED 1TB - Best Price"
      );
    });

    it("displays price when present", () => {
      render(<DealCard {...defaultProps} />);
      expect(screen.getByTestId("deal-price")).toHaveTextContent("£529.99");
    });

    it("displays search term badge", () => {
      render(<DealCard {...defaultProps} />);
      expect(screen.getByTestId("search-term-badge")).toHaveTextContent(
        "steam-deck"
      );
    });

    it("displays merchant badge when present", () => {
      render(<DealCard {...defaultProps} />);
      expect(screen.getByTestId("merchant-badge")).toHaveTextContent("Amazon");
    });
  });

  describe("optional fields", () => {
    it("does not show price when not provided", () => {
      render(<DealCard {...defaultProps} price={undefined} />);
      expect(screen.queryByTestId("deal-price")).not.toBeInTheDocument();
    });

    it("does not show merchant when not provided", () => {
      render(<DealCard {...defaultProps} merchant={undefined} />);
      expect(screen.queryByTestId("merchant-badge")).not.toBeInTheDocument();
    });

    it("does not show timestamp when not provided", () => {
      render(<DealCard {...defaultProps} timestamp={undefined} />);
      expect(screen.queryByTestId("deal-timestamp")).not.toBeInTheDocument();
    });
  });

  describe("filter status", () => {
    it("does not show filter badge for passed deals", () => {
      render(<DealCard {...defaultProps} filterStatus="passed" />);
      expect(screen.queryByTestId("filter-status-badge")).not.toBeInTheDocument();
    });

    it("does not show filter badge when no filter status", () => {
      render(<DealCard {...defaultProps} />);
      expect(screen.queryByTestId("filter-status-badge")).not.toBeInTheDocument();
    });

    it("shows 'No Match' badge for filtered_no_match status", () => {
      render(<DealCard {...defaultProps} filterStatus="filtered_no_match" />);
      expect(screen.getByTestId("filter-status-badge")).toHaveTextContent("No Match");
    });

    it("shows 'Excluded' badge for filtered_exclude status", () => {
      render(<DealCard {...defaultProps} filterStatus="filtered_exclude" />);
      expect(screen.getByTestId("filter-status-badge")).toHaveTextContent("Excluded");
    });

    it("shows 'Missing Keywords' badge for filtered_include status", () => {
      render(<DealCard {...defaultProps} filterStatus="filtered_include" />);
      expect(screen.getByTestId("filter-status-badge")).toHaveTextContent("Missing Keywords");
    });

    it("applies reduced opacity to filtered deals", () => {
      render(<DealCard {...defaultProps} filterStatus="filtered_exclude" />);
      const card = screen.getByTestId("deal-card-deal-123");
      expect(card).toHaveStyle({ opacity: "0.6" });
    });

    it("does not apply reduced opacity to passed deals", () => {
      render(<DealCard {...defaultProps} filterStatus="passed" />);
      const card = screen.getByTestId("deal-card-deal-123");
      expect(card).toHaveStyle({ opacity: "1" });
    });
  });

  describe("match details", () => {
    it("renders match details toggle button", () => {
      render(<DealCard {...defaultProps} />);
      expect(screen.getByTestId("match-details-toggle")).toBeInTheDocument();
      expect(screen.getByText("Why did this match?")).toBeInTheDocument();
    });

    it("match details content exists in DOM", () => {
      render(<DealCard {...defaultProps} />);
      // Content is in DOM but collapsed (hidden via CSS)
      expect(screen.getByTestId("match-details-content")).toBeInTheDocument();
    });

    it("displays matched segments when toggle is clicked", async () => {
      const user = userEvent.setup();
      render(<DealCard {...defaultProps} matchDetails={matchDetailsJson} />);

      await user.click(screen.getByTestId("match-details-toggle"));

      // Content should be visible after toggle
      expect(screen.getByText("Matched text:")).toBeInTheDocument();
    });

    it("shows content on toggle click", async () => {
      const user = userEvent.setup();
      render(<DealCard {...defaultProps} matchDetails={matchDetailsJson} />);

      // Toggle open
      await user.click(screen.getByTestId("match-details-toggle"));

      // Verify content is accessible
      expect(screen.getByTestId("match-details-content")).toBeInTheDocument();
      expect(screen.getByText("Matched text:")).toBeInTheDocument();
    });

    it("computes match details for old records without stored data", async () => {
      const user = userEvent.setup();
      render(<DealCard {...defaultProps} matchDetails={undefined} />);

      await user.click(screen.getByTestId("match-details-toggle"));

      // Should show computed match details based on title/merchant/searchTerm
      expect(screen.getByTestId("match-details-content")).toBeInTheDocument();
    });

    it("displays include keyword matches when present", async () => {
      const user = userEvent.setup();
      render(<DealCard {...defaultProps} matchDetails={matchDetailsJson} />);

      await user.click(screen.getByTestId("match-details-toggle"));

      expect(screen.getByText(/Required keywords found/)).toBeInTheDocument();
    });
  });
});
