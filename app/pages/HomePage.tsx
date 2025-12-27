import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Box,
  Alert,
  SimpleGrid,
  ActionIcon,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconBrandDiscord,
  IconSearch,
  IconBell,
  IconSettings,
  IconAlertCircle,
  IconArrowRight,
  IconRadar,
  IconWebhook,
  IconSun,
  IconMoon,
  IconSparkles,
  IconLock,
} from "@tabler/icons-react";
import { Link } from "react-router";

export interface HomePageProps {
  isAuthenticated: boolean;
  error?: string | null;
}

export function HomePage({ isAuthenticated, error }: HomePageProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <Box
      data-testid="home-page"
      style={{
        minHeight: "100vh",
        background:
          colorScheme === "dark"
            ? "var(--slate-950)"
            : "linear-gradient(180deg, #fffbf7 0%, #fff8f0 50%, #fff5eb 100%)",
      }}
    >
      {/* Floating Header */}
      <Box
        component="header"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "1rem 1.5rem",
        }}
      >
        <Container size="lg">
          <Group justify="space-between">
            {/* Logo */}
            <Group gap="sm">
              <Box
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "var(--gradient-flame)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(255, 144, 37, 0.3)",
                }}
              >
                <IconRadar size={20} color="white" stroke={2} />
              </Box>
              <Text
                fw={700}
                size="lg"
                style={{
                  letterSpacing: "-0.02em",
                  color: colorScheme === "dark" ? "#fafafa" : "#18181b",
                }}
              >
                DealPing
              </Text>
            </Group>

            {/* Theme Toggle */}
            <ActionIcon
              variant="subtle"
              size="lg"
              radius="xl"
              onClick={toggleColorScheme}
              aria-label="Toggle colour scheme"
              style={{
                background:
                  colorScheme === "dark"
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.05)",
                backdropFilter: "blur(10px)",
              }}
            >
              {colorScheme === "dark" ? (
                <IconSun size={18} stroke={1.5} />
              ) : (
                <IconMoon size={18} stroke={1.5} />
              )}
            </ActionIcon>
          </Group>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        style={{
          minHeight: "85vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          paddingTop: 80,
        }}
      >
        {/* Background Effects */}
        <Box
          style={{
            position: "absolute",
            top: "-30%",
            left: "-20%",
            width: "140%",
            height: "140%",
            background:
              colorScheme === "dark"
                ? `
                    radial-gradient(ellipse at 25% 30%, rgba(255, 144, 37, 0.12) 0%, transparent 50%),
                    radial-gradient(ellipse at 75% 70%, rgba(88, 101, 242, 0.08) 0%, transparent 50%)
                  `
                : `
                    radial-gradient(ellipse at 25% 30%, rgba(255, 144, 37, 0.15) 0%, transparent 40%),
                    radial-gradient(ellipse at 75% 70%, rgba(255, 200, 150, 0.2) 0%, transparent 50%)
                  `,
            animation: "float 25s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />

        {/* Decorative Elements */}
        <Box
          style={{
            position: "absolute",
            top: "15%",
            right: "10%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              colorScheme === "dark"
                ? "radial-gradient(circle, rgba(255, 144, 37, 0.05) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(255, 180, 100, 0.15) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />

        <Container size="md" style={{ position: "relative", zIndex: 1 }}>
          <Stack gap="xl" align="center" ta="center">
            {/* Animated Logo Mark */}
            <Box
              style={{
                width: 88,
                height: 88,
                borderRadius: 24,
                background: "var(--gradient-flame)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  colorScheme === "dark"
                    ? "0 0 60px rgba(255, 144, 37, 0.4), 0 20px 40px rgba(0, 0, 0, 0.3)"
                    : "0 20px 50px rgba(255, 144, 37, 0.35), 0 10px 20px rgba(0, 0, 0, 0.1)",
                animation: "fadeInUp 0.6s ease-out forwards",
              }}
            >
              <IconRadar size={48} color="white" stroke={1.5} />
            </Box>

            {/* Hero Title */}
            <Stack
              gap={12}
              style={{
                animation: "fadeInUp 0.6s ease-out 0.1s forwards",
                opacity: 0,
              }}
            >
              <Title
                order={1}
                data-testid="hero-title"
                style={{
                  fontSize: "clamp(2.75rem, 8vw, 4.5rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                  color: colorScheme === "dark" ? "#fafafa" : "#18181b",
                }}
              >
                Never Miss a{" "}
                <Text
                  component="span"
                  inherit
                  style={{
                    background: "var(--gradient-flame)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Hot Deal
                </Text>
              </Title>
              <Text
                size="xl"
                style={{
                  maxWidth: 520,
                  margin: "0 auto",
                  lineHeight: 1.7,
                  color:
                    colorScheme === "dark"
                      ? "var(--slate-400)"
                      : "var(--slate-600)",
                }}
              >
                Custom Discord notifications for the best deals from HotUKDeals.
                Track search terms, filter by keywords, and never pay full price
                again.
              </Text>
            </Stack>

            {error === "not_allowed" && (
              <Alert
                icon={<IconLock size={18} />}
                title="Invite Only"
                color="orange"
                radius="lg"
                data-testid="not-allowed-error"
                style={{
                  maxWidth: 400,
                  animation: "fadeInUp 0.5s ease-out forwards",
                }}
              >
                This app is currently invite-only. Your Discord account is not on the allowlist.
              </Alert>
            )}

            {error && error !== "not_allowed" && (
              <Alert
                icon={<IconAlertCircle size={18} />}
                title="Authentication Failed"
                color="red"
                radius="lg"
                data-testid="auth-error"
                style={{
                  maxWidth: 400,
                  animation: "fadeInUp 0.5s ease-out forwards",
                }}
              >
                There was a problem signing in. Please try again.
              </Alert>
            )}

            {/* CTA Button */}
            <Box
              style={{
                animation: "fadeInUp 0.6s ease-out 0.2s forwards",
                opacity: 0,
              }}
            >
              {isAuthenticated ? (
                <Button
                  component={Link}
                  to="/dashboard"
                  size="xl"
                  radius="xl"
                  leftSection={<IconSettings size={22} />}
                  rightSection={<IconArrowRight size={18} />}
                  data-testid="dashboard-button"
                  style={{
                    background: "var(--gradient-flame)",
                    border: "none",
                    boxShadow:
                      colorScheme === "dark"
                        ? "0 8px 30px rgba(255, 144, 37, 0.4)"
                        : "0 8px 30px rgba(255, 144, 37, 0.35)",
                    padding: "0 2rem",
                    height: 56,
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    transition: "all 0.25s ease",
                  }}
                >
                  Open Dashboard
                </Button>
              ) : error === "not_allowed" ? (
                <Box
                  data-testid="invite-only-badge"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0.75rem 1.5rem",
                    borderRadius: 50,
                    background:
                      colorScheme === "dark"
                        ? "rgba(255, 144, 37, 0.15)"
                        : "rgba(255, 144, 37, 0.1)",
                    border: `1px solid ${colorScheme === "dark" ? "rgba(255, 144, 37, 0.3)" : "rgba(255, 144, 37, 0.2)"}`,
                  }}
                >
                  <IconLock
                    size={20}
                    style={{ color: "var(--flame-500)" }}
                  />
                  <Text
                    fw={600}
                    style={{ color: "var(--flame-500)" }}
                  >
                    Private Beta
                  </Text>
                </Box>
              ) : (
                <Button
                  component={Link}
                  to="/auth/login"
                  size="xl"
                  radius="xl"
                  leftSection={<IconBrandDiscord size={24} />}
                  rightSection={<IconArrowRight size={18} />}
                  data-testid="login-button"
                  style={{
                    background: "linear-gradient(135deg, #5865F2, #4752C4)",
                    border: "none",
                    boxShadow:
                      colorScheme === "dark"
                        ? "0 8px 30px rgba(88, 101, 242, 0.4)"
                        : "0 8px 30px rgba(88, 101, 242, 0.3)",
                    padding: "0 2rem",
                    height: 56,
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    transition: "all 0.25s ease",
                  }}
                >
                  Sign in with Discord
                </Button>
              )}
            </Box>

            {/* Trust indicator */}
            <Group
              gap="xs"
              style={{
                animation: "fadeInUp 0.6s ease-out 0.3s forwards",
                opacity: 0,
              }}
            >
              <IconSparkles
                size={16}
                style={{
                  color:
                    colorScheme === "dark"
                      ? "var(--flame-400)"
                      : "var(--flame-600)",
                }}
              />
              <Text
                size="sm"
                c="dimmed"
                style={{
                  color:
                    colorScheme === "dark"
                      ? "var(--slate-500)"
                      : "var(--slate-500)",
                }}
              >
                {error === "not_allowed"
                  ? "Contact the admin for access"
                  : "Free to use · Invite only"}
              </Text>
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box
        style={{
          background:
            colorScheme === "dark"
              ? "var(--slate-900)"
              : "linear-gradient(180deg, #fff5eb 0%, #ffffff 100%)",
          borderTop:
            colorScheme === "dark"
              ? "1px solid rgba(255, 255, 255, 0.05)"
              : "1px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        <Container size="lg" py={{ base: 60, md: 100 }}>
          {/* Section Header */}
          <Stack align="center" mb={50}>
            <Text
              size="sm"
              fw={600}
              tt="uppercase"
              style={{
                letterSpacing: "0.1em",
                color: "var(--flame-500)",
              }}
            >
              Features
            </Text>
            <Title
              order={2}
              ta="center"
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 700,
                color: colorScheme === "dark" ? "#fafafa" : "#18181b",
              }}
            >
              Everything you need to hunt deals
            </Title>
          </Stack>

          <SimpleGrid
            cols={{ base: 1, sm: 3 }}
            spacing={{ base: "lg", md: 32 }}
          >
            {[
              {
                icon: IconWebhook,
                title: "Multiple Channels",
                description:
                  "Send notifications to different Discord channels with separate webhooks. Organise deals by category or priority.",
                delay: 0.4,
              },
              {
                icon: IconSearch,
                title: "Smart Filters",
                description:
                  "Configure search terms with include and exclude keywords. Only get notified about deals you actually want.",
                delay: 0.5,
              },
              {
                icon: IconBell,
                title: "Real-time Alerts",
                description:
                  "Get notified within minutes when matching deals are posted. Never miss a limited-time offer again.",
                delay: 0.6,
              },
            ].map((feature) => (
              <Box
                key={feature.title}
                data-testid={`feature-${feature.title.toLowerCase().replace(" ", "-")}`}
                style={{
                  padding: "2rem",
                  background:
                    colorScheme === "dark"
                      ? "rgba(39, 39, 42, 0.5)"
                      : "#ffffff",
                  border: `1px solid ${colorScheme === "dark" ? "rgba(63, 63, 70, 0.5)" : "rgba(0, 0, 0, 0.06)"}`,
                  borderRadius: 20,
                  boxShadow:
                    colorScheme === "dark"
                      ? "0 4px 20px rgba(0, 0, 0, 0.2)"
                      : "0 4px 20px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.05)",
                  transition: "all 0.3s ease",
                  animation: `fadeInUp 0.5s ease-out ${feature.delay}s forwards`,
                  opacity: 0,
                }}
              >
                <Box
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      colorScheme === "dark"
                        ? "rgba(255, 144, 37, 0.15)"
                        : "linear-gradient(135deg, rgba(255, 144, 37, 0.12), rgba(255, 180, 100, 0.12))",
                    color: "var(--flame-500)",
                    marginBottom: "1.25rem",
                  }}
                >
                  <feature.icon size={28} stroke={1.5} />
                </Box>
                <Text
                  fw={700}
                  size="lg"
                  mb={8}
                  style={{
                    color: colorScheme === "dark" ? "#fafafa" : "#18181b",
                  }}
                >
                  {feature.title}
                </Text>
                <Text
                  size="sm"
                  lh={1.7}
                  style={{
                    color:
                      colorScheme === "dark"
                        ? "var(--slate-400)"
                        : "var(--slate-600)",
                  }}
                >
                  {feature.description}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        style={{
          background: colorScheme === "dark" ? "var(--slate-950)" : "#ffffff",
          borderTop:
            colorScheme === "dark"
              ? "1px solid rgba(255, 255, 255, 0.05)"
              : "1px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        <Container size="lg" py="xl">
          <Text
            size="sm"
            ta="center"
            style={{
              color:
                colorScheme === "dark"
                  ? "var(--slate-600)"
                  : "var(--slate-400)",
            }}
          >
            Built for deal hunters who refuse to pay full price.
          </Text>
        </Container>
      </Box>
    </Box>
  );
}
