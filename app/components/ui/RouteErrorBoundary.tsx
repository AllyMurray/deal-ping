import { isRouteErrorResponse, useRouteError, Link } from "react-router";
import {
  Container,
  Title,
  Text,
  Stack,
  Button,
  Group,
  Paper,
  ThemeIcon,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconHome,
  IconRefresh,
  IconArrowLeft,
} from "@tabler/icons-react";

interface RouteErrorBoundaryProps {
  /** Custom title for 404 errors */
  notFoundTitle?: string;
  /** Custom message for 404 errors */
  notFoundMessage?: string;
  /** Custom title for generic errors */
  errorTitle?: string;
  /** Custom message for generic errors */
  errorMessage?: string;
  /** Path to navigate back to (defaults to /dashboard) */
  backPath?: string;
  /** Label for back button */
  backLabel?: string;
}

export function RouteErrorBoundary({
  notFoundTitle = "Page Not Found",
  notFoundMessage = "The page you're looking for doesn't exist or has been moved.",
  errorTitle = "Something went wrong",
  errorMessage = "An unexpected error occurred. Please try again.",
  backPath = "/dashboard",
  backLabel = "Go to Dashboard",
}: RouteErrorBoundaryProps) {
  const error = useRouteError();

  const is404 = isRouteErrorResponse(error) && error.status === 404;
  const title = is404 ? notFoundTitle : errorTitle;
  const message = is404
    ? notFoundMessage
    : isRouteErrorResponse(error)
      ? error.statusText || errorMessage
      : errorMessage;

  const statusCode = isRouteErrorResponse(error) ? error.status : 500;

  return (
    <Container size="sm" py="xl">
      <Paper p="xl" radius="md" withBorder>
        <Stack align="center" gap="lg">
          <ThemeIcon
            size={80}
            radius="xl"
            color={is404 ? "gray" : "red"}
            variant="light"
          >
            <IconAlertTriangle size={40} />
          </ThemeIcon>

          <Stack align="center" gap="xs">
            <Text size="xl" fw={700} c="dimmed">
              {statusCode}
            </Text>
            <Title order={2} ta="center">
              {title}
            </Title>
            <Text c="dimmed" ta="center" maw={400}>
              {message}
            </Text>
          </Stack>

          {import.meta.env.DEV && error instanceof Error && error.stack && (
            <Paper
              p="md"
              radius="sm"
              bg="gray.1"
              w="100%"
              style={{ overflow: "auto" }}
            >
              <Text size="xs" ff="monospace" style={{ whiteSpace: "pre-wrap" }}>
                {error.stack}
              </Text>
            </Paper>
          )}

          <Group>
            <Button
              component={Link}
              to={backPath}
              leftSection={<IconArrowLeft size={16} />}
              variant="light"
            >
              {backLabel}
            </Button>
            <Button
              onClick={() => window.location.reload()}
              leftSection={<IconRefresh size={16} />}
              variant="outline"
            >
              Try Again
            </Button>
            <Button
              component={Link}
              to="/"
              leftSection={<IconHome size={16} />}
              variant="subtle"
            >
              Home
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}
