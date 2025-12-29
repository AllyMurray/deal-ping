import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "~/test-utils";
import { DiscordPreview } from "./DiscordPreview";

describe("DiscordPreview", () => {
  describe("rendering", () => {
    it("renders lock screen preview section", () => {
      render(<DiscordPreview searchTerm="steam-deck" />);
      expect(screen.getByText("Lock Screen Preview")).toBeInTheDocument();
    });

    it("renders discord embed preview section", () => {
      render(<DiscordPreview searchTerm="steam-deck" />);
      expect(screen.getByText("Discord Embed Preview")).toBeInTheDocument();
    });

    it("renders embed title with sample deal", () => {
      render(<DiscordPreview searchTerm="steam-deck" />);
      expect(screen.getByTestId("embed-title")).toBeInTheDocument();
    });

    it("displays search term in sample deal title", () => {
      render(<DiscordPreview searchTerm="ps5" />);
      expect(screen.getByTestId("embed-title")).toHaveTextContent(/ps5/i);
    });

    it("displays price field", () => {
      render(<DiscordPreview searchTerm="steam-deck" />);
      expect(screen.getByText("Price")).toBeInTheDocument();
    });

    it("displays merchant field", () => {
      render(<DiscordPreview searchTerm="steam-deck" />);
      expect(screen.getByText("Merchant")).toBeInTheDocument();
      // Amazon UK appears in both lock screen preview and embed preview
      expect(screen.getAllByText(/Amazon UK/).length).toBeGreaterThanOrEqual(1);
    });

    it("displays why matched field", () => {
      render(<DiscordPreview searchTerm="steam-deck" />);
      expect(screen.getByText("Why Matched")).toBeInTheDocument();
    });

    it("displays search term in footer", () => {
      render(<DiscordPreview searchTerm="nintendo-switch" />);
      expect(screen.getByText(/Search Term: nintendo-switch/)).toBeInTheDocument();
    });
  });

  describe("price filters", () => {
    it("does not show active filters section when no filters set", () => {
      render(<DiscordPreview searchTerm="steam-deck" />);
      expect(screen.queryByText("Active Filters")).not.toBeInTheDocument();
    });

    it("shows active filters section when maxPrice is set", () => {
      render(<DiscordPreview searchTerm="steam-deck" maxPrice={50} />);
      expect(screen.getByText("Active Filters")).toBeInTheDocument();
      expect(screen.getByText(/Only deals under/)).toBeInTheDocument();
      expect(screen.getByText("£50.00")).toBeInTheDocument();
    });

    it("shows active filters section when minDiscount is set", () => {
      render(<DiscordPreview searchTerm="steam-deck" minDiscount={30} />);
      expect(screen.getByText("Active Filters")).toBeInTheDocument();
      expect(screen.getByText(/Only deals with at least/)).toBeInTheDocument();
      expect(screen.getByText("30% discount")).toBeInTheDocument();
    });

    it("shows both filters when both are set", () => {
      render(<DiscordPreview searchTerm="steam-deck" maxPrice={100} minDiscount={25} />);
      expect(screen.getByText("Active Filters")).toBeInTheDocument();
      expect(screen.getByText("£100.00")).toBeInTheDocument();
      expect(screen.getByText("25% discount")).toBeInTheDocument();
    });
  });

  describe("default search term", () => {
    it("shows placeholder when no search term provided", () => {
      render(<DiscordPreview searchTerm="" />);
      expect(screen.getByText(/Search Term: your-search-term/)).toBeInTheDocument();
    });
  });
});
