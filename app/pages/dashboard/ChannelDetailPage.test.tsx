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
  },
  {
    searchTerm: "Xbox",
    enabled: false,
    includeKeywords: [],
    excludeKeywords: ["refurbished"],
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
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    });

    it("shows appropriate empty state message", () => {
      render(<ChannelDetailPage {...defaultProps} configs={[]} />);
      expect(screen.getByTestId("empty-state-title")).toHaveTextContent(
        "No search terms"
      );
    });

    it("does not show empty state when configs exist", () => {
      render(<ChannelDetailPage {...defaultProps} />);
      expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
    });
  });
});
