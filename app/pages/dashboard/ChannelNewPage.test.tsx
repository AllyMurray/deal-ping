import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "~/test-utils";
import { ChannelNewPage } from "./ChannelNewPage";

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

const defaultProps = {
  onCancel: vi.fn(),
};

describe("ChannelNewPage", () => {
  describe("rendering", () => {
    it("renders the page container", () => {
      render(<ChannelNewPage {...defaultProps} />);
      expect(screen.getByTestId("channel-new-page")).toBeInTheDocument();
    });

    it("renders the page title", () => {
      render(<ChannelNewPage {...defaultProps} />);
      expect(screen.getByTestId("page-title")).toHaveTextContent("Add Channel");
    });

    it("renders the page description", () => {
      render(<ChannelNewPage {...defaultProps} />);
      expect(
        screen.getByText("Create a new Discord webhook channel")
      ).toBeInTheDocument();
    });
  });

  describe("form", () => {
    it("renders the channel form", () => {
      render(<ChannelNewPage {...defaultProps} />);
      expect(screen.getByTestId("channel-form")).toBeInTheDocument();
    });

    it("renders name input field", () => {
      render(<ChannelNewPage {...defaultProps} />);
      expect(screen.getByTestId("channel-name-input")).toBeInTheDocument();
    });

    it("renders webhook URL input field", () => {
      render(<ChannelNewPage {...defaultProps} />);
      expect(screen.getByTestId("webhook-url-input")).toBeInTheDocument();
    });

    it("renders submit button with Create Channel label", () => {
      render(<ChannelNewPage {...defaultProps} />);
      expect(screen.getByTestId("submit-button")).toHaveTextContent(
        "Create Channel"
      );
    });

    it("renders cancel button", () => {
      render(<ChannelNewPage {...defaultProps} />);
      expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
    });

    it("calls onCancel when cancel button clicked", async () => {
      const user = userEvent.setup();
      render(<ChannelNewPage {...defaultProps} />);
      await user.click(screen.getByTestId("cancel-button"));
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });
  });
});
