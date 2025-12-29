import {
  Title,
  Text,
  Stack,
  Box,
  TextInput,
  Button,
  Group,
  ActionIcon,
  Table,
  Badge,
  Modal,
  Avatar,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import {
  IconPlus,
  IconTrash,
  IconShield,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

interface ActionResponse {
  success: boolean;
  error?: string;
  intent?: string;
}

export interface AllowedUserDisplay {
  discordId: string;
  username?: string;
  avatar?: string;
  isAdmin: boolean;
  addedBy: string;
  addedAt?: string;
}

export interface AdminPageProps {
  users: AllowedUserDisplay[];
  currentUserId: string;
}

export function AdminPage({ users, currentUserId }: AdminPageProps) {
  const fetcher = useFetcher<ActionResponse>();
  const [newDiscordId, setNewDiscordId] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const adminCount = users.filter((u) => u.isAdmin).length;
  const isOnlyAdmin = adminCount === 1 && users.find((u) => u.discordId === currentUserId)?.isAdmin;

  // Track pending intent for loading states
  const pendingIntent = fetcher.formData?.get("intent");
  const isSubmitting = fetcher.state !== "idle" && pendingIntent === "addUser";
  const isDeleting = fetcher.state !== "idle" && pendingIntent === "deleteUser";

  // Handle fetcher completion
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        if (fetcher.data.intent === "addUser") {
          setNewDiscordId("");
          notifications.show({
            title: "Success",
            message: "User added to allowlist",
            color: "green",
          });
        }
        if (fetcher.data.intent === "deleteUser") {
          setDeleteUserId(null);
          notifications.show({
            title: "Success",
            message: "User removed from allowlist",
            color: "green",
          });
        }
      } else if (fetcher.data.error) {
        notifications.show({
          title: "Error",
          message: fetcher.data.error,
          color: "red",
        });
      }
    }
  }, [fetcher.state, fetcher.data]);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscordId.trim()) return;

    fetcher.submit(
      { intent: "addUser", discordId: newDiscordId.trim() },
      { method: "POST" }
    );
  };

  const handleDeleteUser = () => {
    if (!deleteUserId) return;

    fetcher.submit(
      { intent: "deleteUser", discordId: deleteUserId },
      { method: "POST" }
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Stack gap="xl" data-testid="admin-page">
      {/* Header */}
      <Box
        style={{
          animation: "fadeInUp 0.5s ease-out forwards",
        }}
      >
        <Group gap="sm" mb={4}>
          <IconShield size={28} stroke={1.5} style={{ color: "var(--flame-500)" }} />
          <Title order={2} data-testid="page-title">
            Admin
          </Title>
        </Group>
        <Text c="dimmed" size="lg">
          Manage who can access DealPing.
        </Text>
      </Box>

      {/* Add User Form */}
      <Box
        className="card-glass"
        p="lg"
        style={{
          borderRadius: 16,
          animation: "fadeInUp 0.5s ease-out 0.1s forwards",
          opacity: 0,
        }}
      >
        <Text fw={600} mb="md">
          Add User to Allowlist
        </Text>
        <form onSubmit={handleAddUser}>
          <Group align="flex-end">
            <TextInput
              label="Discord User ID"
              placeholder="123456789012345678"
              description="The user's Discord ID (18-digit number)"
              value={newDiscordId}
              onChange={(e) => setNewDiscordId(e.target.value)}
              style={{ flex: 1 }}
              data-testid="discord-id-input"
            />
            <Button
              type="submit"
              leftSection={<IconPlus size={18} />}
              loading={isSubmitting}
              disabled={!newDiscordId.trim()}
              data-testid="add-user-button"
            >
              Add User
            </Button>
          </Group>
        </form>
      </Box>

      {/* Users Table */}
      <Box
        className="card-glass"
        p="lg"
        style={{
          borderRadius: 16,
          animation: "fadeInUp 0.5s ease-out 0.2s forwards",
          opacity: 0,
        }}
      >
        <Text fw={600} mb="md">
          Allowed Users ({users.length})
        </Text>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>User</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Added</Table.Th>
              <Table.Th style={{ width: 60 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => {
              const isCurrentUser = user.discordId === currentUserId;
              const canDelete = !isCurrentUser && !(user.isAdmin && isOnlyAdmin);

              return (
                <Table.Tr key={user.discordId} data-testid={`user-row-${user.discordId}`}>
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar
                        src={user.avatar}
                        size="sm"
                        radius="xl"
                        color={user.isAdmin ? "orange" : "gray"}
                      >
                        {user.username?.charAt(0).toUpperCase() || "?"}
                      </Avatar>
                      <Box>
                        <Group gap={6}>
                          <Text size="sm" fw={500}>
                            {user.username || "Unknown"}
                          </Text>
                          {user.isAdmin && (
                            <IconShield size={14} style={{ color: "var(--flame-500)" }} />
                          )}
                          {isCurrentUser && (
                            <Badge size="xs" variant="light">
                              You
                            </Badge>
                          )}
                        </Group>
                        <Text size="xs" c="dimmed" ff="monospace">
                          {user.discordId}
                        </Text>
                      </Box>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={user.isAdmin ? "orange" : "gray"}
                      variant="light"
                    >
                      {user.isAdmin ? "Admin" : "User"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {formatDate(user.addedAt)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {canDelete && (
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => setDeleteUserId(user.discordId)}
                        data-testid={`delete-user-${user.discordId}`}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Box>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        title="Remove User"
        centered
      >
        <Text mb="lg">
          Are you sure you want to remove this user from the allowlist? They will no longer be able to access DealPing.
        </Text>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={() => setDeleteUserId(null)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={handleDeleteUser}
            loading={isDeleting}
          >
            Remove User
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}
