import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "~/test-utils";
import { ChannelForm } from "./ChannelForm";

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigation: () => ({ state: "idle" }),
    Form: ({
      children,
      ...props
    }: { children: React.ReactNode } & React.FormHTMLAttributes<HTMLFormElement>) => (
      <form {...props}>{children}</form>
    ),
  };
});

const defaultProps = {
  onCancel: vi.fn(),
};

describe("ChannelForm", () => {
  describe("rendering", () => {
    it("renders the form", () => {
      render(<ChannelForm {...defaultProps} />);
      expect(screen.getByTestId("channel-form")).toBeInTheDocument();
    });

    it("renders empty fields by default", () => {
      render(<ChannelForm {...defaultProps} />);
      expect(screen.getByTestId("channel-name-input")).toHaveValue("");
      expect(screen.getByTestId("webhook-url-input")).toHaveValue("");
    });

    it("renders with initial values when provided", () => {
      render(
        <ChannelForm
          {...defaultProps}
          initialValues={{
            name: "Test Channel",
            webhookUrl: "https://discord.com/api/webhooks/123/abc",
          }}
        />
      );
      expect(screen.getByTestId("channel-name-input")).toHaveValue(
        "Test Channel"
      );
      expect(screen.getByTestId("webhook-url-input")).toHaveValue(
        "https://discord.com/api/webhooks/123/abc"
      );
    });

    it("renders default submit label", () => {
      render(<ChannelForm {...defaultProps} />);
      expect(screen.getByTestId("submit-button")).toHaveTextContent("Save");
    });

    it("renders custom submit label when provided", () => {
      render(<ChannelForm {...defaultProps} submitLabel="Create Channel" />);
      expect(screen.getByTestId("submit-button")).toHaveTextContent(
        "Create Channel"
      );
    });
  });

  describe("validation setup", () => {
    it("has required attribute on name input", () => {
      render(<ChannelForm {...defaultProps} />);
      expect(screen.getByTestId("channel-name-input")).toHaveAttribute(
        "required"
      );
    });

    it("has required attribute on webhook URL input", () => {
      render(<ChannelForm {...defaultProps} />);
      expect(screen.getByTestId("webhook-url-input")).toHaveAttribute(
        "required"
      );
    });

    it("has placeholder for webhook URL showing expected format", () => {
      render(<ChannelForm {...defaultProps} />);
      expect(screen.getByTestId("webhook-url-input")).toHaveAttribute(
        "placeholder",
        "https://discord.com/api/webhooks/..."
      );
    });

    it("has placeholder for name input", () => {
      render(<ChannelForm {...defaultProps} />);
      expect(screen.getByTestId("channel-name-input")).toHaveAttribute(
        "placeholder",
        "e.g., Gaming Deals"
      );
    });
  });

  describe("interactions", () => {
    it("calls onCancel when cancel button is clicked", async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();
      render(<ChannelForm onCancel={onCancel} />);

      const cancelButton = screen.getByTestId("cancel-button");
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("allows typing in name input", async () => {
      const user = userEvent.setup();
      render(<ChannelForm {...defaultProps} />);

      const nameInput = screen.getByTestId("channel-name-input");
      await user.type(nameInput, "Gaming Deals");

      expect(nameInput).toHaveValue("Gaming Deals");
    });

    it("allows typing in webhook URL input", async () => {
      const user = userEvent.setup();
      render(<ChannelForm {...defaultProps} />);

      const webhookInput = screen.getByTestId("webhook-url-input");
      await user.type(
        webhookInput,
        "https://discord.com/api/webhooks/123/abc"
      );

      expect(webhookInput).toHaveValue(
        "https://discord.com/api/webhooks/123/abc"
      );
    });
  });

  describe("form labels", () => {
    it("has correct label for name input", () => {
      render(<ChannelForm {...defaultProps} />);
      expect(screen.getByLabelText(/channel name/i)).toBeInTheDocument();
    });

    it("has correct label for webhook URL input", () => {
      render(<ChannelForm {...defaultProps} />);
      expect(screen.getByLabelText(/discord webhook url/i)).toBeInTheDocument();
    });
  });
});
