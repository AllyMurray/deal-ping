import {
  TextInput,
  Button,
  Stack,
  Group,
  Switch,
  Select,
  Paper,
  Text,
  Collapse,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Form, useNavigation } from "react-router";
import { IconMoon } from "@tabler/icons-react";

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

export interface ChannelFormValues {
  name: string;
  webhookUrl: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  quietHoursTimezone: string;
}

export interface ChannelFormProps {
  initialValues?: Partial<ChannelFormValues>;
  onCancel: () => void;
  submitLabel?: string;
}

export function ChannelForm({
  initialValues,
  onCancel,
  submitLabel = "Save",
}: ChannelFormProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const form = useForm<ChannelFormValues>({
    initialValues: {
      name: "",
      webhookUrl: "",
      quietHoursEnabled: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      quietHoursTimezone: "Europe/London",
      ...initialValues,
    },
    validate: {
      name: (value) =>
        value.trim().length < 1 ? "Name is required" : null,
      webhookUrl: (value) => {
        if (!value.trim()) return "Webhook URL is required";
        if (!value.includes("discord.com/api/webhooks/")) {
          return "Must be a valid Discord webhook URL";
        }
        return null;
      },
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
    <Form
      method="post"
      onSubmit={(e) => {
        const result = form.validate();
        if (result.hasErrors) {
          e.preventDefault();
        }
      }}
      data-testid="channel-form"
    >
      <Stack gap="md">
        <TextInput
          name="name"
          label="Channel Name"
          placeholder="e.g., Gaming Deals"
          required
          data-testid="channel-name-input"
          {...form.getInputProps("name")}
        />
        <TextInput
          name="webhookUrl"
          label="Discord Webhook URL"
          placeholder="https://discord.com/api/webhooks/..."
          required
          data-testid="webhook-url-input"
          {...form.getInputProps("webhookUrl")}
        />

        {/* Quiet Hours Section */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" mb={form.values.quietHoursEnabled ? "md" : 0}>
            <Group gap="sm">
              <IconMoon size={20} style={{ color: "var(--mantine-color-dimmed)" }} />
              <div>
                <Text size="sm" fw={500}>
                  Quiet Hours
                </Text>
                <Text size="xs" c="dimmed">
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
              data-testid="quiet-hours-toggle"
            />
          </Group>

          <Collapse in={form.values.quietHoursEnabled}>
            <Stack gap="sm">
              <Text size="xs" c="dimmed">
                Deals found during quiet hours will be queued and sent when
                quiet hours end.
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
                data={TIMEZONE_OPTIONS}
                data-testid="quiet-hours-timezone-select"
                {...form.getInputProps("quietHoursTimezone")}
              />
            </Stack>
          </Collapse>
        </Paper>

        <Group justify="flex-end" mt="md">
          <Button
            variant="subtle"
            onClick={onCancel}
            disabled={isSubmitting}
            data-testid="cancel-button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            data-testid="submit-button"
          >
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </Form>
  );
}
