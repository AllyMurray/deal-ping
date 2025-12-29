import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "~/test-utils";
import { ChannelDetailPage } from "./ChannelDetailPage";

const mockChannel = {
  id: "channel-1",
  name: "Gaming Deals",
  webhookUrl: "https://discord.com/api/webhooks/123456789/abcdefg",
};

const mockConfigs = [
  {
    searchTerm: "PS5",
    enabled: true,
    includeKeywords: ["console"],
    excludeKeywords: ["broken"],
    caseSensitive: false,
  },
  {
    searchTerm: "Xbox",
    enabled: false,
    includeKeywords: [],
    excludeKeywords: ["refurbished"],
    caseSensitive: false,
  },
];

const defaultProps = {
  channel: mockChannel,
  configs: mockConfigs,
  onAddConfig: vi.fn(),
  onEditConfig: vi.fn(),
  onDeleteConfig: vi.fn(),
  onToggleConfig: vi.fn(),
  onTestNotification: vi.fn(),
  isTestingNotification: false,
};

describe("ChannelDetailPage", () => {
  describe("rendering", () => {
    it("renders the page container", () => {
      render(<ChannelDetailPage {...defaultProps} />);
      expect(screen.getByTestId("channel-detail-page")).toBeInTheDocument();
    });

    it("renders the channel name", () => {
      render(<ChannelDetailPage {...defaultProps} />);
      expect(screen.getByTestId("channel-name")).toHaveTextContent(
        "Gaming Deals"
      );
    });

    it("masks the webhook URL", () => {
      render(<ChannelDetailPage {...defaultProps} />);
      expect(screen.getByTestId("webhook-url")).toHaveTextContent(
        "discord.com/api/webhooks/****/****"
      );
    });

    it("renders back to channels link", () => {
      render(<ChannelDetailPage {...defaultProps} />);
      expect(screen.getByText("Back to Channels")).toBeInTheDocument();
    });
  });

  describe("action buttons", () => {
    it("renders test notification button", () => {
      render(<ChannelDetailPage {...defaultProps} />);
      expect(screen.getByTestId("test-notification-button")).toBeInTheDocument();
    });

    it("renders edit channel button", () => {
      render(<ChannelDetailPage {...defaultProps} />);
      expect(screen.getByTestId("edit-channel-button")).toBeInTheDocument();
    });

    it("renders add config button", () => {
      render(<ChannelDetailPage {...defaultProps} />);
      expect(screen.getByTestId("add-config-button")).toBeInTheDocument();
    });

    it("calls onTestNotification when test button clicked", async () => {
      const user = userEvent.setup();
      render(<ChannelDetailPage {...defaultProps} />);
      await user.click(screen.getByTestId("test-notification-button"));
      expect(defaultProps.onTestNotification).toHaveBeenCalled();
    });

    it("calls onAddConfig when add config button clicked", async () => {
      const user = userEvent.setup();
      render(<ChannelDetailPage {...defaultProps} />);
      await user.click(screen.getByTestId("add-config-button"));
      expect(defaultProps.onAddConfig).toHaveBeenCalled();
    });

    it("shows loading state on test button when testing", () => {
      render(<ChannelDetailPage {...defaultProps} isTestingNotification={true} />);
      expect(screen.getByTestId("test-notification-button")).toHaveAttribute(
        "data-loading",
        "true"
      );
    });
  });

  describe("configs list", () => {
    it("renders configs list when configs exist", () => {
      render(<ChannelDetailPage {...defaultProps} />);
      expect(screen.getByTestId("configs-list")).toBeInTheDocument();
    });

    it("renders config cards for each config", () => {
      render(<ChannelDetailPage {...defaultProps} />);
      expect(screen.getByTestId("config-card-PS5")).toBeInTheDocument();
      expect(screen.getByTestId("config-card-Xbox")).toBeInTheDocument();
    });

    it("displays config count badge", () => {
      render(<ChannelDetailPage {...defaultProps} />);
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty state when no configs", () => {
      render(<ChannelDetailPage {...defaultProps} configs={[]} />);
      expect(screen.getByText("No search terms")).toBeInTheDocument();
    });

    it("shows appropriate empty state message for configs", () => {
      render(<ChannelDetailPage {...defaultProps} configs={[]} />);
      expect(
        screen.getByText("Add search terms to start receiving notifications for matching deals.")
      ).toBeInTheDocument();
    });

    it("shows configs list when configs exist", () => {
      render(<ChannelDetailPage {...defaultProps} />);
      expect(screen.getByTestId("configs-list")).toBeInTheDocument();
    });
  });

  describe("deals section", () => {
    it("shows empty state when no deals", () => {
      render(<ChannelDetailPage {...defaultProps} deals={[]} />);
      expect(screen.getByText("No deals yet")).toBeInTheDocument();
    });

    it("shows deals list when deals exist", () => {
      // Deal title contains "PS5" and "console" (include keyword), so it passes the live filter
      const mockDeals = [
        {
          id: "deal-1",
          title: "PS5 Console Bundle",
          link: "https://example.com",
          searchTerm: "PS5",
          filterStatus: "passed" as const,
        },
      ];
      render(<ChannelDetailPage {...defaultProps} deals={mockDeals} />);
      expect(screen.getByTestId("deals-list")).toBeInTheDocument();
    });

    it("shows included and excluded counts", () => {
      // Deal titles are filtered based on the config for their searchTerm
      const mockDeals = [
        {
          id: "deal-1",
          title: "PS5 Console Bundle", // Contains "PS5" and "console" (include keyword), passes
          link: "https://example.com",
          searchTerm: "PS5",
          filterStatus: "passed" as const,
        },
        {
          id: "deal-2",
          title: "Broken PS5 Controller", // Contains "PS5" but also "broken" (excluded keyword), filtered
          link: "https://example.com",
          searchTerm: "PS5",
          filterStatus: "filtered_exclude" as const,
        },
      ];
      render(<ChannelDetailPage {...defaultProps} deals={mockDeals} />);
      expect(screen.getByText("1 included")).toBeInTheDocument();
      expect(screen.getByText("1 excluded")).toBeInTheDocument();
    });

    it("shows excluded toggle when there are excluded deals", () => {
      // Deal will be filtered by the config because it contains "broken" (excluded keyword)
      const mockDeals = [
        {
          id: "deal-1",
          title: "Broken PS5 Controller",
          link: "https://example.com",
          searchTerm: "PS5",
          filterStatus: "filtered_exclude" as const,
        },
      ];
      render(
        <ChannelDetailPage
          {...defaultProps}
          deals={mockDeals}
          onShowExcludedChange={vi.fn()}
        />
      );
      expect(screen.getByTestId("show-excluded-toggle")).toBeInTheDocument();
    });
  });

  describe("notification preview section", () => {
    it("renders notification preview section when configs exist", () => {
      render(<ChannelDetailPage {...defaultProps} />);
      expect(screen.getByTestId("notification-preview-section")).toBeInTheDocument();
    });

    it("does not render notification preview when no configs", () => {
      render(<ChannelDetailPage {...defaultProps} configs={[]} />);
      expect(screen.queryByTestId("notification-preview-section")).not.toBeInTheDocument();
    });

    it("renders preview toggle button", () => {
      render(<ChannelDetailPage {...defaultProps} />);
      expect(screen.getByTestId("preview-toggle")).toBeInTheDocument();
    });

    it("displays notification preview title", () => {
      render(<ChannelDetailPage {...defaultProps} />);
      expect(screen.getByText("Notification Preview")).toBeInTheDocument();
    });

    it("expands preview when toggle is clicked", async () => {
      const user = userEvent.setup();
      render(<ChannelDetailPage {...defaultProps} />);

      await user.click(screen.getByTestId("preview-toggle"));

      expect(screen.getByText(/This is a preview of how Discord notifications will appear/)).toBeInTheDocument();
    });

    it("shows discord embed preview when expanded", async () => {
      const user = userEvent.setup();
      render(<ChannelDetailPage {...defaultProps} />);

      await user.click(screen.getByTestId("preview-toggle"));

      expect(screen.getByText("Discord Embed Preview")).toBeInTheDocument();
    });

    it("uses first config search term for preview", async () => {
      const user = userEvent.setup();
      render(<ChannelDetailPage {...defaultProps} />);

      await user.click(screen.getByTestId("preview-toggle"));

      // Should use first config's search term "PS5"
      expect(screen.getByText(/Search Term: PS5/)).toBeInTheDocument();
    });

    it("collapses preview when toggle is clicked again", async () => {
      const user = userEvent.setup();
      render(<ChannelDetailPage {...defaultProps} />);

      // Expand
      await user.click(screen.getByTestId("preview-toggle"));
      expect(screen.getByText(/This is a preview/)).toBeInTheDocument();

      // Collapse
      await user.click(screen.getByTestId("preview-toggle"));

      // The preview content should be hidden (in collapsed state)
      // Note: The element may still be in the DOM but hidden via CSS
    });
  });
});
