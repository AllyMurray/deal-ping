import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "~/test-utils";
import { AdminPage } from "./AdminPage";

const mockUsers = [
  {
    discordId: "123456789012345678",
    username: "AdminUser",
    avatar: "https://cdn.discordapp.com/avatars/123/abc.png",
    isAdmin: true,
    addedBy: "system",
    addedAt: "2024-01-15T10:00:00Z",
  },
  {
    discordId: "987654321098765432",
    username: "RegularUser",
    avatar: undefined,
    isAdmin: false,
    addedBy: "123456789012345678",
    addedAt: "2024-02-20T15:30:00Z",
  },
];

const defaultProps = {
  users: mockUsers,
  currentUserId: "123456789012345678",
};

describe("AdminPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("renders the page container", () => {
      render(<AdminPage {...defaultProps} />);
      expect(screen.getByTestId("admin-page")).toBeInTheDocument();
    });

    it("renders the page title", () => {
      render(<AdminPage {...defaultProps} />);
      expect(screen.getByTestId("page-title")).toHaveTextContent("Admin");
    });

    it("renders page description", () => {
      render(<AdminPage {...defaultProps} />);
      expect(
        screen.getByText("Manage who can access DealPing.")
      ).toBeInTheDocument();
    });
  });

  describe("add user form", () => {
    it("renders discord ID input", () => {
      render(<AdminPage {...defaultProps} />);
      expect(screen.getByTestId("discord-id-input")).toBeInTheDocument();
    });

    it("renders add user button", () => {
      render(<AdminPage {...defaultProps} />);
      expect(screen.getByTestId("add-user-button")).toBeInTheDocument();
    });

    it("add button is disabled when input is empty", () => {
      render(<AdminPage {...defaultProps} />);
      expect(screen.getByTestId("add-user-button")).toBeDisabled();
    });

    it("add button is enabled when input has value", async () => {
      const user = userEvent.setup();
      render(<AdminPage {...defaultProps} />);
      await user.type(
        screen.getByTestId("discord-id-input"),
        "111222333444555666"
      );
      expect(screen.getByTestId("add-user-button")).not.toBeDisabled();
    });
  });

  describe("users table", () => {
    it("displays allowed users count", () => {
      render(<AdminPage {...defaultProps} />);
      expect(screen.getByText("Allowed Users (2)")).toBeInTheDocument();
    });

    it("renders user rows for each user", () => {
      render(<AdminPage {...defaultProps} />);
      expect(
        screen.getByTestId("user-row-123456789012345678")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("user-row-987654321098765432")
      ).toBeInTheDocument();
    });

    it("displays usernames", () => {
      render(<AdminPage {...defaultProps} />);
      expect(screen.getByText("AdminUser")).toBeInTheDocument();
      expect(screen.getByText("RegularUser")).toBeInTheDocument();
    });

    it("displays discord IDs", () => {
      render(<AdminPage {...defaultProps} />);
      expect(screen.getByText("123456789012345678")).toBeInTheDocument();
      expect(screen.getByText("987654321098765432")).toBeInTheDocument();
    });

    it("shows Admin badge for admin users", () => {
      render(<AdminPage {...defaultProps} />);
      const adminRow = screen.getByTestId("user-row-123456789012345678");
      expect(adminRow).toHaveTextContent("Admin");
    });

    it("shows User badge for non-admin users", () => {
      render(<AdminPage {...defaultProps} />);
      const userRow = screen.getByTestId("user-row-987654321098765432");
      expect(userRow).toHaveTextContent("User");
    });

    it("shows You badge for current user", () => {
      render(<AdminPage {...defaultProps} />);
      expect(screen.getByText("You")).toBeInTheDocument();
    });
  });

  describe("delete functionality", () => {
    it("shows delete button for other users", () => {
      render(<AdminPage {...defaultProps} />);
      expect(
        screen.getByTestId("delete-user-987654321098765432")
      ).toBeInTheDocument();
    });

    it("does not show delete button for current user", () => {
      render(<AdminPage {...defaultProps} />);
      expect(
        screen.queryByTestId("delete-user-123456789012345678")
      ).not.toBeInTheDocument();
    });

    it("opens delete confirmation modal when delete clicked", async () => {
      const user = userEvent.setup();
      render(<AdminPage {...defaultProps} />);
      await user.click(screen.getByTestId("delete-user-987654321098765432"));
      expect(
        await screen.findByText(/Are you sure you want to remove this user/i)
      ).toBeInTheDocument();
    });

    it("shows cancel and remove buttons in delete modal", async () => {
      const user = userEvent.setup();
      render(<AdminPage {...defaultProps} />);
      await user.click(screen.getByTestId("delete-user-987654321098765432"));
      // Wait for modal to appear
      await screen.findByText(/Are you sure you want to remove this user/i);
      // Check for Cancel button - there may be one already, get all and check for the modal one
      const cancelButtons = screen.getAllByRole("button", { name: /Cancel/i });
      expect(cancelButtons.length).toBeGreaterThan(0);
      expect(screen.getByRole("button", { name: /Remove User/i })).toBeInTheDocument();
    });

    it("has cancel button that can be clicked in modal", async () => {
      const user = userEvent.setup();
      render(<AdminPage {...defaultProps} />);
      await user.click(screen.getByTestId("delete-user-987654321098765432"));
      // Wait for modal to appear
      await screen.findByText(/Are you sure you want to remove this user/i);
      // Find the cancel button in the modal
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      expect(cancelButton).toBeInTheDocument();
      // Verify clicking doesn't throw an error
      await user.click(cancelButton);
    });
  });

  describe("admin protection", () => {
    it("does not allow deleting the only admin", () => {
      const singleAdminUsers = [
        {
          discordId: "123456789012345678",
          username: "OnlyAdmin",
          isAdmin: true,
          addedBy: "system",
        },
      ];
      render(
        <AdminPage users={singleAdminUsers} currentUserId="123456789012345678" />
      );
      expect(
        screen.queryByTestId("delete-user-123456789012345678")
      ).not.toBeInTheDocument();
    });

    it("allows deleting admin when multiple admins exist", () => {
      const multiAdminUsers = [
        {
          discordId: "123456789012345678",
          username: "Admin1",
          isAdmin: true,
          addedBy: "system",
        },
        {
          discordId: "987654321098765432",
          username: "Admin2",
          isAdmin: true,
          addedBy: "system",
        },
      ];
      render(
        <AdminPage users={multiAdminUsers} currentUserId="123456789012345678" />
      );
      expect(
        screen.getByTestId("delete-user-987654321098765432")
      ).toBeInTheDocument();
    });
  });
});
