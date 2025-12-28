import {
  TextInput,
  Button,
  Stack,
  Group,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Form, useNavigation } from "react-router";

export interface ChannelFormValues {
  name: string;
  webhookUrl: string;
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
