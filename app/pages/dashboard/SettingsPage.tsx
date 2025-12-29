import {
  Title,
  Text,
  Stack,
  Paper,
  Group,
  Switch,
  TextInput,
  Select,
  Button,
  Collapse,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Form, useNavigation } from "react-router";
import { IconMoon, IconSettings } from "@tabler/icons-react";

const TIMEZONE_OPTIONS = [
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET/CEST)" },
  { value: "Europe/Dublin", label: "Dublin (GMT/IST)" },
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
  { value: "America/Chicago", label: "Chicago (CST/CDT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "UTC", label: "UTC" },
];

export interface SettingsFormValues {
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  quietHoursTimezone: string;
}

export interface SettingsPageProps {
  settings: SettingsFormValues;
}

export function SettingsPage({ settings }: SettingsPageProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const form = useForm<SettingsFormValues>({
    initialValues: {
      quietHoursEnabled: settings.quietHoursEnabled,
      quietHoursStart: settings.quietHoursStart || "22:00",
      quietHoursEnd: settings.quietHoursEnd || "08:00",
      quietHoursTimezone: settings.quietHoursTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    validate: {
      quietHoursStart: (value, values) => {
        if (!values.quietHoursEnabled) return null;
        if (!value) return "Start time is required";
        if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
          return "Use HH:mm format (e.g., 22:00)";
        }
        return null;
      },
      quietHoursEnd: (value, values) => {
        if (!values.quietHoursEnabled) return null;
        if (!value) return "End time is required";
        if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
          return "Use HH:mm format (e.g., 08:00)";
        }
        return null;
      },
    },
  });

  return (
    <Stack gap="lg" data-testid="settings-page">
      <div>
        <Group gap="sm" mb={4}>
          <IconSettings size={28} stroke={1.5} />
          <Title order={2}>Settings</Title>
        </Group>
        <Text c="dimmed" size="sm">
          Configure your account preferences
        </Text>
      </div>

      <Form
        method="post"
        onSubmit={(e) => {
          const result = form.validate();
          if (result.hasErrors) {
            e.preventDefault();
          }
        }}
        data-testid="settings-form"
      >
        <Paper withBorder p="lg">
          <Group justify="space-between" mb={form.values.quietHoursEnabled ? "md" : 0}>
            <Group gap="sm">
              <IconMoon size={24} style={{ color: "var(--mantine-color-violet-6)" }} />
              <div>
                <Text size="md" fw={600}>
                  Quiet Hours
                </Text>
                <Text size="sm" c="dimmed">
                  Pause notifications during specific hours
                </Text>
              </div>
            </Group>
            <Switch
              name="quietHoursEnabled"
              checked={form.values.quietHoursEnabled}
              onChange={(e) =>
                form.setFieldValue("quietHoursEnabled", e.currentTarget.checked)
              }
              size="md"
              data-testid="quiet-hours-toggle"
            />
          </Group>

          <Collapse in={form.values.quietHoursEnabled}>
            <Stack gap="md" mt="md">
              <Text size="sm" c="dimmed">
                Deals found during quiet hours will be queued and sent as a batch
                when quiet hours end. This setting applies to all your channels.
              </Text>
              <Group grow>
                <TextInput
                  name="quietHoursStart"
                  label="Start Time"
                  placeholder="22:00"
                  description="24-hour format"
                  data-testid="quiet-hours-start-input"
                  {...form.getInputProps("quietHoursStart")}
                />
                <TextInput
                  name="quietHoursEnd"
                  label="End Time"
                  placeholder="08:00"
                  description="24-hour format"
                  data-testid="quiet-hours-end-input"
                  {...form.getInputProps("quietHoursEnd")}
                />
              </Group>
              <Select
                name="quietHoursTimezone"
                label="Timezone"
                description="Your local timezone for quiet hours"
                data={TIMEZONE_OPTIONS}
                searchable
                data-testid="quiet-hours-timezone-select"
                {...form.getInputProps("quietHoursTimezone")}
              />
            </Stack>
          </Collapse>

          <Group justify="flex-end" mt="lg">
            <Button
              type="submit"
              loading={isSubmitting}
              data-testid="save-settings-button"
            >
              Save Settings
            </Button>
          </Group>
        </Paper>
      </Form>
    </Stack>
  );
}
