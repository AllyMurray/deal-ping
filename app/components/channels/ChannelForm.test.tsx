import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
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

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const defaultProps = {
  onCancel: vi.fn(),
};

describe("ChannelForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
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

  describe("webhook validation", () => {
    it("renders the validate webhook button", () => {
      render(<ChannelForm {...defaultProps} />);
      expect(screen.getByTestId("validate-webhook-button")).toBeInTheDocument();
    });

    it("disables validate button when webhook URL is empty", () => {
      render(<ChannelForm {...defaultProps} />);
      expect(screen.getByTestId("validate-webhook-button")).toBeDisabled();
    });

    it("enables validate button when webhook URL has value", async () => {
      const user = userEvent.setup();
      render(<ChannelForm {...defaultProps} />);

      const webhookInput = screen.getByTestId("webhook-url-input");
      await user.type(webhookInput, "https://discord.com/api/webhooks/123/abc");

      expect(screen.getByTestId("validate-webhook-button")).toBeEnabled();
    });

    it("shows error for invalid webhook URL format", async () => {
      const user = userEvent.setup();
      render(<ChannelForm {...defaultProps} />);

      const webhookInput = screen.getByTestId("webhook-url-input");
      await user.type(webhookInput, "https://example.com/webhook");

      const validateButton = screen.getByTestId("validate-webhook-button");
      await user.click(validateButton);

      expect(
        screen.getByTestId("webhook-validation-error")
      ).toBeInTheDocument();
      expect(screen.getByText("Must be a valid Discord webhook URL")).toBeInTheDocument();
    });

    it("shows success message for valid webhook", async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({
          valid: true,
          webhookName: "Test Webhook",
        }),
      });

      const user = userEvent.setup();
      render(<ChannelForm {...defaultProps} />);

      const webhookInput = screen.getByTestId("webhook-url-input");
      await user.type(webhookInput, "https://discord.com/api/webhooks/123/abc");

      const validateButton = screen.getByTestId("validate-webhook-button");
      await user.click(validateButton);

      await waitFor(() => {
        expect(
          screen.getByTestId("webhook-validation-success")
        ).toBeInTheDocument();
      });
      expect(screen.getByText("Webhook verified: Test Webhook")).toBeInTheDocument();
    });

    it("shows error message for invalid webhook", async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({
          valid: false,
          error: "Webhook not found. It may have been deleted.",
        }),
      });

      const user = userEvent.setup();
      render(<ChannelForm {...defaultProps} />);

      const webhookInput = screen.getByTestId("webhook-url-input");
      await user.type(webhookInput, "https://discord.com/api/webhooks/123/abc");

      const validateButton = screen.getByTestId("validate-webhook-button");
      await user.click(validateButton);

      await waitFor(() => {
        expect(
          screen.getByTestId("webhook-validation-error")
        ).toBeInTheDocument();
      });
      expect(
        screen.getByText("Webhook not found. It may have been deleted.")
      ).toBeInTheDocument();
    });

    it("shows error message when fetch fails", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const user = userEvent.setup();
      render(<ChannelForm {...defaultProps} />);

      const webhookInput = screen.getByTestId("webhook-url-input");
      await user.type(webhookInput, "https://discord.com/api/webhooks/123/abc");

      const validateButton = screen.getByTestId("validate-webhook-button");
      await user.click(validateButton);

      await waitFor(() => {
        expect(
          screen.getByTestId("webhook-validation-error")
        ).toBeInTheDocument();
      });
      expect(
        screen.getByText("Failed to validate webhook. Please try again.")
      ).toBeInTheDocument();
    });

    it("calls fetch with correct parameters", async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ valid: true, webhookName: "Test" }),
      });

      const user = userEvent.setup();
      render(<ChannelForm {...defaultProps} />);

      const webhookInput = screen.getByTestId("webhook-url-input");
      await user.type(webhookInput, "https://discord.com/api/webhooks/123/abc");

      const validateButton = screen.getByTestId("validate-webhook-button");
      await user.click(validateButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/webhooks/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            webhookUrl: "https://discord.com/api/webhooks/123/abc",
          }),
        });
      });
    });
  });
});
