import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "~/test-utils";
import { ChannelForm } from "./ChannelForm";

// Create a mock submit function we can track
const mockSubmit = vi.fn();

// Create controllable fetcher state
let mockFetcherState: "idle" | "submitting" | "loading" = "idle";
let mockFetcherData: { intent: string; valid: boolean; webhookName?: string; error?: string } | undefined;

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigation: () => ({ state: "idle" }),
    useFetcher: () => ({
      state: mockFetcherState,
      data: mockFetcherData,
      submit: mockSubmit,
    }),
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
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetcherState = "idle";
    mockFetcherData = undefined;
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

    it("shows success message for valid webhook", () => {
      mockFetcherData = { intent: "validate", valid: true, webhookName: "Test Webhook" };

      render(
        <ChannelForm
          {...defaultProps}
          initialValues={{
            webhookUrl: "https://discord.com/api/webhooks/123/abc",
          }}
        />
      );

      expect(
        screen.getByTestId("webhook-validation-success")
      ).toBeInTheDocument();
      expect(screen.getByText("Webhook verified: Test Webhook")).toBeInTheDocument();
    });

    it("shows error message for invalid webhook", () => {
      mockFetcherData = {
        intent: "validate",
        valid: false,
        error: "Webhook not found. It may have been deleted.",
      };

      render(
        <ChannelForm
          {...defaultProps}
          initialValues={{
            webhookUrl: "https://discord.com/api/webhooks/123/abc",
          }}
        />
      );

      expect(
        screen.getByTestId("webhook-validation-error")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Webhook not found. It may have been deleted.")
      ).toBeInTheDocument();
    });

    it("calls fetcher.submit with intent and webhookUrl", async () => {
      const user = userEvent.setup();
      render(<ChannelForm {...defaultProps} />);

      const webhookInput = screen.getByTestId("webhook-url-input");
      await user.type(webhookInput, "https://discord.com/api/webhooks/123/abc");

      const validateButton = screen.getByTestId("validate-webhook-button");
      await user.click(validateButton);

      expect(mockSubmit).toHaveBeenCalledWith(
        { intent: "validate", webhookUrl: "https://discord.com/api/webhooks/123/abc" },
        { method: "POST" }
      );
    });
  });
});
