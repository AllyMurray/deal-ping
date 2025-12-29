import type { Route } from "./+types/admin";
import { requireAdmin } from "~/lib/auth/helpers.server";
import {
  getAllowedUsers,
  addAllowedUser,
  removeAllowedUser,
  getAllowedUser,
  isUserAllowed,
} from "~/db/repository.server";
import { AdminPage, type AllowedUserDisplay } from "~/pages/dashboard/AdminPage";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireAdmin(request);
  const users = await getAllowedUsers();

  return {
    users: users.map((u): AllowedUserDisplay => ({
      discordId: u.discordId,
      username: u.username,
      avatar: u.avatar,
      isAdmin: u.isAdmin,
      addedBy: u.addedBy,
      addedAt: u.addedAt,
    })),
    currentUserId: user.id,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { user } = await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "addUser") {
    const discordId = formData.get("discordId") as string;

    if (!discordId || typeof discordId !== "string") {
      return { success: false, error: "Discord ID is required" };
    }

    // Validate Discord ID format (17-19 digit number)
    if (!/^\d{17,19}$/.test(discordId)) {
      return { success: false, error: "Invalid Discord ID format" };
    }

    // Check if user already exists
    const exists = await isUserAllowed({ discordId });
    if (exists) {
      return { success: false, error: "User is already on the allowlist" };
    }

    await addAllowedUser({
      discordId,
      addedBy: user.id,
      isAdmin: false,
    });

    return { success: true, intent: "addUser" };
  }

  if (intent === "deleteUser") {
    const discordId = formData.get("discordId") as string;

    if (!discordId) {
      return { success: false, error: "Discord ID is required" };
    }

    // Cannot delete yourself
    if (discordId === user.id) {
      return { success: false, error: "You cannot remove yourself from the allowlist" };
    }

    // Check if user exists
    const targetUser = await getAllowedUser({ discordId });
    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    // Cannot delete the only admin
    if (targetUser.isAdmin) {
      const users = await getAllowedUsers();
      const adminCount = users.filter((u) => u.isAdmin).length;
      if (adminCount === 1) {
        return { success: false, error: "Cannot remove the only admin" };
      }
    }

    await removeAllowedUser({ discordId });

    return { success: true, intent: "deleteUser" };
  }

  return { success: false, error: "Invalid intent" };
}

export default function AdminRoute({ loaderData }: Route.ComponentProps) {
  return <AdminPage users={loaderData.users} currentUserId={loaderData.currentUserId} />;
}
