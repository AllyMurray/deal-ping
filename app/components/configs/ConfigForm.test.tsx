import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "~/test-utils";
import { ConfigForm } from "./ConfigForm";

const defaultProps = {
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

describe("ConfigForm", () => {
  describe("rendering", () => {
    it("renders the form", () => {
      render(<ConfigForm {...defaultProps} />);
      expect(screen.getByTestId("config-form")).toBeInTheDocument();
    });

    it("renders empty fields by default", () => {
      render(<ConfigForm {...defaultProps} />);
      expect(screen.getByTestId("search-term-input")).toHaveValue("");
    });

    it("renders enabled switch as checked by default", () => {
      render(<ConfigForm {...defaultProps} />);
      expect(screen.getByTestId("enabled-switch")).toBeChecked();
    });

    it("renders case sensitive switch as unchecked by default", () => {
      render(<ConfigForm {...defaultProps} />);
      expect(screen.getByTestId("case-sensitive-switch")).not.toBeChecked();
    });

    it("renders with initial values when provided", () => {
      render(
        <ConfigForm
          {...defaultProps}
          initialValues={{
            searchTerm: "ps5",
            enabled: false,
            caseSensitive: true,
          }}
        />
      );
      expect(screen.getByTestId("search-term-input")).toHaveValue("ps5");
      expect(screen.getByTestId("enabled-switch")).not.toBeChecked();
      expect(screen.getByTestId("case-sensitive-switch")).toBeChecked();
    });

    it("renders default submit label", () => {
      render(<ConfigForm {...defaultProps} />);
      expect(screen.getByTestId("submit-button")).toHaveTextContent("Save");
    });

    it("renders custom submit label when provided", () => {
      render(<ConfigForm {...defaultProps} submitLabel="Add Search Term" />);
      expect(screen.getByTestId("submit-button")).toHaveTextContent(
        "Add Search Term"
      );
    });

    it("disables search term input when editing", () => {
      render(
        <ConfigForm
          {...defaultProps}
          isEditing={true}
          initialValues={{ searchTerm: "existing-term" }}
        />
      );
      expect(screen.getByTestId("search-term-input")).toBeDisabled();
    });

    it("enables search term input when not editing", () => {
      render(<ConfigForm {...defaultProps} isEditing={false} />);
      expect(screen.getByTestId("search-term-input")).not.toBeDisabled();
    });
  });

  describe("validation setup", () => {
    it("has required attribute on search term input", () => {
      render(<ConfigForm {...defaultProps} />);
      expect(screen.getByTestId("search-term-input")).toHaveAttribute(
        "required"
      );
    });

    it("has placeholder for search term input", () => {
      render(<ConfigForm {...defaultProps} />);
      expect(screen.getByTestId("search-term-input")).toHaveAttribute(
        "placeholder",
        "e.g., steam-deck, ps5, nintendo"
      );
    });

    it("has description text for enabled switch", () => {
      render(<ConfigForm {...defaultProps} />);
      expect(
        screen.getByText("Receive notifications for this search term")
      ).toBeInTheDocument();
    });

    it("has description text for include keywords", () => {
      render(<ConfigForm {...defaultProps} />);
      expect(
        screen.getByText("Deals must contain at least one of these words")
      ).toBeInTheDocument();
    });

    it("has description text for exclude keywords", () => {
      render(<ConfigForm {...defaultProps} />);
      expect(
        screen.getByText("Exclude deals containing any of these words")
      ).toBeInTheDocument();
    });

    it("has description text for case sensitive switch", () => {
      render(<ConfigForm {...defaultProps} />);
      expect(
        screen.getByText("Match keywords with exact case")
      ).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onCancel when cancel button is clicked", async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();
      render(<ConfigForm {...defaultProps} onCancel={onCancel} />);

      const cancelButton = screen.getByTestId("cancel-button");
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("allows typing in search term input", async () => {
      const user = userEvent.setup();
      render(<ConfigForm {...defaultProps} />);

      const searchTermInput = screen.getByTestId("search-term-input");
      await user.type(searchTermInput, "nintendo-switch");

      expect(searchTermInput).toHaveValue("nintendo-switch");
    });

    it("allows toggling enabled switch", async () => {
      const user = userEvent.setup();
      render(<ConfigForm {...defaultProps} />);

      const enabledSwitch = screen.getByTestId("enabled-switch");
      expect(enabledSwitch).toBeChecked();

      await user.click(enabledSwitch);
      expect(enabledSwitch).not.toBeChecked();

      await user.click(enabledSwitch);
      expect(enabledSwitch).toBeChecked();
    });

    it("allows toggling case sensitive switch", async () => {
      const user = userEvent.setup();
      render(<ConfigForm {...defaultProps} />);

      const caseSensitiveSwitch = screen.getByTestId("case-sensitive-switch");
      expect(caseSensitiveSwitch).not.toBeChecked();

      await user.click(caseSensitiveSwitch);
      expect(caseSensitiveSwitch).toBeChecked();

      await user.click(caseSensitiveSwitch);
      expect(caseSensitiveSwitch).not.toBeChecked();
    });
  });

  describe("submitting state", () => {
    it("disables cancel button when submitting", () => {
      render(<ConfigForm {...defaultProps} isSubmitting={true} />);
      expect(screen.getByTestId("cancel-button")).toBeDisabled();
    });

    it("shows loading state on submit button when submitting", () => {
      render(<ConfigForm {...defaultProps} isSubmitting={true} />);
      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).toHaveAttribute("data-loading", "true");
    });
  });

  describe("form labels", () => {
    it("has correct label for search term input", () => {
      render(<ConfigForm {...defaultProps} />);
      expect(screen.getByText("Search Term")).toBeInTheDocument();
    });

    it("has correct label for enabled switch", () => {
      render(<ConfigForm {...defaultProps} />);
      expect(screen.getByText("Enabled")).toBeInTheDocument();
    });

    it("has correct label for case sensitive switch", () => {
      render(<ConfigForm {...defaultProps} />);
      expect(screen.getByText("Case Sensitive")).toBeInTheDocument();
    });
  });

  describe("price threshold inputs", () => {
    it("renders price threshold section", () => {
      render(<ConfigForm {...defaultProps} />);
      expect(screen.getByText("Price Thresholds")).toBeInTheDocument();
      expect(
        screen.getByText("Only receive notifications when deals meet these criteria")
      ).toBeInTheDocument();
    });

    it("renders max price input", () => {
      render(<ConfigForm {...defaultProps} />);
      expect(screen.getByTestId("max-price-input")).toBeInTheDocument();
      expect(screen.getByText("Maximum Price")).toBeInTheDocument();
      expect(
        screen.getByText("Only notify if price is under this amount")
      ).toBeInTheDocument();
    });

    it("renders min discount input", () => {
      render(<ConfigForm {...defaultProps} />);
      expect(screen.getByTestId("min-discount-input")).toBeInTheDocument();
      expect(screen.getByText("Minimum Discount")).toBeInTheDocument();
      expect(
        screen.getByText("Only notify if discount is at least this %")
      ).toBeInTheDocument();
    });

    it("renders with initial price threshold values", () => {
      render(
        <ConfigForm
          {...defaultProps}
          initialValues={{
            searchTerm: "test",
            maxPrice: 50,
            minDiscount: 30,
          }}
        />
      );
      // NumberInput includes prefix/suffix in value
      expect(screen.getByTestId("max-price-input")).toHaveValue("£50");
      expect(screen.getByTestId("min-discount-input")).toHaveValue("30%");
    });

    it("renders with null price threshold values", () => {
      render(
        <ConfigForm
          {...defaultProps}
          initialValues={{
            searchTerm: "test",
            maxPrice: null,
            minDiscount: null,
          }}
        />
      );
      // NumberInput shows empty when value is null
      expect(screen.getByTestId("max-price-input")).toHaveValue("");
      expect(screen.getByTestId("min-discount-input")).toHaveValue("");
    });

    it("allows typing in max price input", async () => {
      const user = userEvent.setup();
      render(<ConfigForm {...defaultProps} />);

      const maxPriceInput = screen.getByTestId("max-price-input");
      await user.type(maxPriceInput, "75");

      expect(maxPriceInput).toHaveValue("£75");
    });

    it("allows typing in min discount input", async () => {
      const user = userEvent.setup();
      render(<ConfigForm {...defaultProps} />);

      const minDiscountInput = screen.getByTestId("min-discount-input");
      await user.type(minDiscountInput, "25");

      expect(minDiscountInput).toHaveValue("25%");
    });
  });
});
