import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "~/test-utils";
import { ChannelCard } from "./ChannelCard";

const defaultProps = {
  id: "test-channel-id",
  name: "Test Channel",
  webhookUrl: "https://discord.com/api/webhooks/123456789/abcdef",
  configCount: 5,
  enabledConfigCount: 3,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe("ChannelCard", () => {
  describe("rendering", () => {
    it("renders the card", () => {
      render(<ChannelCard {...defaultProps} />);
      expect(
        screen.getByTestId("channel-card-test-channel-id")
      ).toBeInTheDocument();
    });

    it("displays channel name", () => {
      render(<ChannelCard {...defaultProps} />);
      expect(screen.getByTestId("channel-name")).toHaveTextContent(
        "Test Channel"
      );
    });

    it("masks webhook URL", () => {
      render(<ChannelCard {...defaultProps} />);
      expect(screen.getByTestId("webhook-url")).toHaveTextContent(
        "discord.com/api/webhooks/****/****"
      );
    });

    it("displays config count", () => {
      render(<ChannelCard {...defaultProps} />);
      expect(screen.getByTestId("config-count")).toHaveTextContent(
        "5 search terms"
      );
    });

    it("displays enabled count when different from total", () => {
      render(<ChannelCard {...defaultProps} />);
      expect(screen.getByTestId("enabled-count")).toHaveTextContent("3 active");
    });

    it("does not show enabled count when all are enabled", () => {
      render(<ChannelCard {...defaultProps} enabledConfigCount={5} />);
      expect(screen.queryByTestId("enabled-count")).not.toBeInTheDocument();
    });
  });

  describe("singular/plural", () => {
    it("shows singular 'term' for 1 config", () => {
      render(<ChannelCard {...defaultProps} configCount={1} />);
      expect(screen.getByTestId("config-count")).toHaveTextContent(
        "1 search term"
      );
    });
  });

  describe("last notification", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows 'No notifications yet' when lastNotificationAt is undefined", () => {
      render(<ChannelCard {...defaultProps} />);
      expect(screen.getByTestId("last-notification")).toHaveTextContent(
        "No notifications yet"
      );
    });

    it("shows relative time when lastNotificationAt is provided", () => {
      render(
        <ChannelCard
          {...defaultProps}
          lastNotificationAt="2024-06-15T10:00:00.000Z"
        />
      );
      expect(screen.getByTestId("last-notification")).toHaveTextContent(
        "Last notification: 2 hours ago"
      );
    });

    it("shows 'just now' for very recent notifications", () => {
      render(
        <ChannelCard
          {...defaultProps}
          lastNotificationAt="2024-06-15T11:59:45.000Z"
        />
      );
      expect(screen.getByTestId("last-notification")).toHaveTextContent(
        "Last notification: just now"
      );
    });
  });
});
