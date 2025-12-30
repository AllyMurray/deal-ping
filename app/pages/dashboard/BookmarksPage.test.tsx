import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "~/test-utils";
import { BookmarksPage } from "./BookmarksPage";

const mockBookmarks = [
  {
    id: "bookmark-1",
    dealId: "deal-123",
    title: "Steam Deck OLED 1TB - Best Price",
    link: "https://hotukdeals.com/deal/123",
    price: "£529.99",
    merchant: "Amazon",
    searchTerm: "steam-deck",
    bookmarkedAt: Date.now(),
  },
  {
    id: "bookmark-2",
    dealId: "deal-456",
    title: "PlayStation 5 Console",
    link: "https://hotukdeals.com/deal/456",
    price: "£429.99",
    merchant: "Argos",
    searchTerm: "ps5",
    bookmarkedAt: Date.now() - 3600000, // 1 hour ago
  },
];

describe("BookmarksPage", () => {
  describe("rendering", () => {
    it("renders the page", () => {
      render(
        <BookmarksPage
          bookmarks={mockBookmarks}
          searchQuery=""
          onSearchQueryChange={() => {}}
        />
      );
      expect(screen.getByTestId("bookmarks-page")).toBeInTheDocument();
    });

    it("displays page title", () => {
      render(
        <BookmarksPage
          bookmarks={mockBookmarks}
          searchQuery=""
          onSearchQueryChange={() => {}}
        />
      );
      expect(screen.getByTestId("page-title")).toHaveTextContent("Bookmarks");
    });

    it("displays bookmark count", () => {
      render(
        <BookmarksPage
          bookmarks={mockBookmarks}
          searchQuery=""
          onSearchQueryChange={() => {}}
        />
      );
      expect(screen.getByText(/2 bookmarked/)).toBeInTheDocument();
    });

    it("renders all bookmark cards", () => {
      render(
        <BookmarksPage
          bookmarks={mockBookmarks}
          searchQuery=""
          onSearchQueryChange={() => {}}
        />
      );
      expect(screen.getByTestId("bookmark-card-deal-123")).toBeInTheDocument();
      expect(screen.getByTestId("bookmark-card-deal-456")).toBeInTheDocument();
    });

    it("displays search input", () => {
      render(
        <BookmarksPage
          bookmarks={mockBookmarks}
          searchQuery=""
          onSearchQueryChange={() => {}}
        />
      );
      expect(screen.getByTestId("search-input")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty state when no bookmarks", () => {
      render(
        <BookmarksPage
          bookmarks={[]}
          searchQuery=""
          onSearchQueryChange={() => {}}
        />
      );
      expect(screen.getByText("No bookmarks yet")).toBeInTheDocument();
      expect(
        screen.getByText(/Bookmark deals from the Deal History page/)
      ).toBeInTheDocument();
    });

    it("shows no matching bookmarks message when search returns nothing", () => {
      render(
        <BookmarksPage
          bookmarks={mockBookmarks}
          searchQuery="nonexistent"
          onSearchQueryChange={() => {}}
        />
      );
      expect(screen.getByText("No matching bookmarks")).toBeInTheDocument();
    });
  });

  describe("search functionality", () => {
    it("filters bookmarks by title", () => {
      render(
        <BookmarksPage
          bookmarks={mockBookmarks}
          searchQuery="steam"
          onSearchQueryChange={() => {}}
        />
      );
      expect(screen.getByTestId("bookmark-card-deal-123")).toBeInTheDocument();
      expect(screen.queryByTestId("bookmark-card-deal-456")).not.toBeInTheDocument();
    });

    it("filters bookmarks by merchant", () => {
      render(
        <BookmarksPage
          bookmarks={mockBookmarks}
          searchQuery="argos"
          onSearchQueryChange={() => {}}
        />
      );
      expect(screen.queryByTestId("bookmark-card-deal-123")).not.toBeInTheDocument();
      expect(screen.getByTestId("bookmark-card-deal-456")).toBeInTheDocument();
    });

    it("filters bookmarks by search term", () => {
      render(
        <BookmarksPage
          bookmarks={mockBookmarks}
          searchQuery="ps5"
          onSearchQueryChange={() => {}}
        />
      );
      expect(screen.queryByTestId("bookmark-card-deal-123")).not.toBeInTheDocument();
      expect(screen.getByTestId("bookmark-card-deal-456")).toBeInTheDocument();
    });

    it("calls onSearchQueryChange when search input changes", async () => {
      const user = userEvent.setup();
      const onSearchQueryChange = vi.fn();
      render(
        <BookmarksPage
          bookmarks={mockBookmarks}
          searchQuery=""
          onSearchQueryChange={onSearchQueryChange}
        />
      );

      await user.type(screen.getByTestId("search-input"), "test");
      expect(onSearchQueryChange).toHaveBeenCalled();
    });
  });

  describe("remove bookmark", () => {
    it("shows remove button when onRemoveBookmark is provided", () => {
      const onRemoveBookmark = vi.fn();
      render(
        <BookmarksPage
          bookmarks={mockBookmarks}
          searchQuery=""
          onSearchQueryChange={() => {}}
          onRemoveBookmark={onRemoveBookmark}
        />
      );
      const removeButtons = screen.getAllByTestId("remove-bookmark-button");
      expect(removeButtons).toHaveLength(2);
    });

    it("calls onRemoveBookmark with deal id when remove button is clicked", async () => {
      const user = userEvent.setup();
      const onRemoveBookmark = vi.fn();
      render(
        <BookmarksPage
          bookmarks={mockBookmarks}
          searchQuery=""
          onSearchQueryChange={() => {}}
          onRemoveBookmark={onRemoveBookmark}
        />
      );

      const removeButtons = screen.getAllByTestId("remove-bookmark-button");
      await user.click(removeButtons[0]);

      expect(onRemoveBookmark).toHaveBeenCalledWith("deal-123");
    });
  });

  describe("bookmark card content", () => {
    it("displays bookmark title", () => {
      render(
        <BookmarksPage
          bookmarks={mockBookmarks}
          searchQuery=""
          onSearchQueryChange={() => {}}
        />
      );
      const titles = screen.getAllByTestId("bookmark-title");
      expect(titles[0]).toHaveTextContent("Steam Deck OLED 1TB - Best Price");
    });

    it("displays bookmark price", () => {
      render(
        <BookmarksPage
          bookmarks={mockBookmarks}
          searchQuery=""
          onSearchQueryChange={() => {}}
        />
      );
      const prices = screen.getAllByTestId("bookmark-price");
      expect(prices[0]).toHaveTextContent("£529.99");
    });

    it("displays search term badge", () => {
      render(
        <BookmarksPage
          bookmarks={mockBookmarks}
          searchQuery=""
          onSearchQueryChange={() => {}}
        />
      );
      const badges = screen.getAllByTestId("search-term-badge");
      expect(badges[0]).toHaveTextContent("steam-deck");
    });

    it("displays merchant badge", () => {
      render(
        <BookmarksPage
          bookmarks={mockBookmarks}
          searchQuery=""
          onSearchQueryChange={() => {}}
        />
      );
      const badges = screen.getAllByTestId("merchant-badge");
      expect(badges[0]).toHaveTextContent("Amazon");
    });

    it("displays bookmarked timestamp", () => {
      render(
        <BookmarksPage
          bookmarks={mockBookmarks}
          searchQuery=""
          onSearchQueryChange={() => {}}
        />
      );
      const timestamps = screen.getAllByTestId("bookmark-timestamp");
      expect(timestamps[0]).toHaveTextContent(/Bookmarked/);
    });
  });
});
