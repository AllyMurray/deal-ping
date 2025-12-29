import {
  TextInput,
  Button,
  Stack,
  Group,
  Alert,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Form, useNavigation, useFetcher } from "react-router";
import { useEffect, useState } from "react";
import type { WebhookValidationResult } from "~/routes/api/webhooks/validate";

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

  const fetcher = useFetcher<WebhookValidationResult>();
  const [clientError, setClientError] = useState<string | null>(null);

  // Clear client error when fetcher starts loading
  useEffect(() => {
    if (fetcher.state === "submitting") {
      setClientError(null);
    }
  }, [fetcher.state]);

  const validateWebhook = (webhookUrl: string) => {
    // Client-side validation before making request
    if (!webhookUrl.includes("discord.com/api/webhooks/")) {
      setClientError("Must be a valid Discord webhook URL");
      return;
    }

    setClientError(null);
    fetcher.submit(
      { webhookUrl },
      { method: "POST", action: "/api/webhooks/validate", encType: "application/json" }
    );
  };

  // Derive validation state from fetcher
  const isValidating = fetcher.state === "submitting" || fetcher.state === "loading";
  const validationResult = fetcher.data;
  const showSuccess = !isValidating && validationResult?.valid === true;
  const showError = clientError || (!isValidating && validationResult?.valid === false);

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
          rightSection={
            <Button
              size="compact-xs"
              variant="light"
              onClick={() => validateWebhook(form.values.webhookUrl)}
              loading={isValidating}
              disabled={!form.values.webhookUrl.trim()}
              data-testid="validate-webhook-button"
            >
              Test
            </Button>
          }
          rightSectionWidth={60}
        />

        {showSuccess && (
          <Alert
            color="green"
            variant="light"
            data-testid="webhook-validation-success"
          >
            Webhook verified: {validationResult?.webhookName}
          </Alert>
        )}

        {showError && (
          <Alert
            color="red"
            variant="light"
            data-testid="webhook-validation-error"
          >
            {clientError ?? validationResult?.error ?? "Invalid webhook"}
          </Alert>
        )}

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
