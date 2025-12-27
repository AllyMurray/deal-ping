import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "~/test-utils";
import { ChannelEditPage } from "./ChannelEditPage";

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigation: () => ({ state: "idle" }),
    Form: ({ children, ...props }: { children: React.ReactNode } & React.FormHTMLAttributes<HTMLFormElement>) => (
      <form {...props}>{children}</form>
    ),
  };
});

const mockChannel = {
  id: "channel-1",
  name: "Gaming Deals",
  webhookUrl: "https://discord.com/api/webhooks/123456789/abcdefg",
};

const defaultProps = {
  channel: mockChannel,
  onCancel: vi.fn(),
};

describe("ChannelEditPage", () => {
  describe("rendering", () => {
    it("renders the page container", () => {
      render(<ChannelEditPage {...defaultProps} />);
      expect(screen.getByTestId("channel-edit-page")).toBeInTheDocument();
    });

    it("renders the page title", () => {
      render(<ChannelEditPage {...defaultProps} />);
      expect(screen.getByTestId("page-title")).toHaveTextContent("Edit Channel");
    });

    it("renders description with channel name", () => {
      render(<ChannelEditPage {...defaultProps} />);
      expect(
        screen.getByText("Update channel settings for Gaming Deals")
      ).toBeInTheDocument();
    });

    it("renders back to channel link", () => {
      render(<ChannelEditPage {...defaultProps} />);
      expect(screen.getByText("Back to Channel")).toBeInTheDocument();
    });
  });

  describe("form", () => {
    it("renders the channel form", () => {
      render(<ChannelEditPage {...defaultProps} />);
      expect(screen.getByTestId("channel-form")).toBeInTheDocument();
    });

    it("pre-fills name input with channel name", () => {
      render(<ChannelEditPage {...defaultProps} />);
      expect(screen.getByTestId("channel-name-input")).toHaveValue(
        "Gaming Deals"
      );
    });

    it("pre-fills webhook URL input with channel webhook", () => {
      render(<ChannelEditPage {...defaultProps} />);
      expect(screen.getByTestId("webhook-url-input")).toHaveValue(
        "https://discord.com/api/webhooks/123456789/abcdefg"
      );
    });

    it("renders submit button with Save Changes label", () => {
      render(<ChannelEditPage {...defaultProps} />);
      expect(screen.getByTestId("submit-button")).toHaveTextContent(
        "Save Changes"
      );
    });

    it("renders cancel button", () => {
      render(<ChannelEditPage {...defaultProps} />);
      expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
    });

    it("calls onCancel when cancel button clicked", async () => {
      const user = userEvent.setup();
      render(<ChannelEditPage {...defaultProps} />);
      await user.click(screen.getByTestId("cancel-button"));
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });
  });
});
