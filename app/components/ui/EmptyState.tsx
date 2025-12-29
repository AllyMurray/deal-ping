import { Stack, Text, Button, ThemeIcon } from "@mantine/core";
import { IconInbox } from "@tabler/icons-react";
import { Link } from "react-router";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <Stack align="center" gap="md" py="xl" data-testid="empty-state">
      <ThemeIcon size={60} radius="xl" variant="light" color="gray">
        {icon || <IconInbox size={30} />}
      </ThemeIcon>
      <Stack align="center" gap="xs">
        <Text fw={600} size="lg" data-testid="empty-state-title">
          {title}
        </Text>
        <Text c="dimmed" ta="center" maw={300} data-testid="empty-state-description">
          {description}
        </Text>
      </Stack>
      {actionLabel && actionHref && (
        <Button
          component={Link}
          to={actionHref}
          data-testid="empty-state-action"
        >
          {actionLabel}
        </Button>
      )}
      {actionLabel && !actionHref && onAction && (
        <Button
          onClick={onAction}
          data-testid="empty-state-action"
        >
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}
