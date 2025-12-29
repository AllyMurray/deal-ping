import {
  TextInput,
  Button,
  Stack,
  Group,
  Alert,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Form, useNavigation } from "react-router";
import { useState, useCallback } from "react";
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

  const [validationState, setValidationState] = useState<{
    status: "idle" | "validating" | "success" | "error";
    message?: string;
  }>({ status: "idle" });

  const validateWebhook = useCallback(async (webhookUrl: string) => {
    if (!webhookUrl.includes("discord.com/api/webhooks/")) {
      setValidationState({
        status: "error",
        message: "Must be a valid Discord webhook URL",
      });
      return;
    }

    setValidationState({ status: "validating" });

    try {
      const response = await fetch("/api/webhooks/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl }),
      });

      const result: WebhookValidationResult = await response.json();

      if (result.valid) {
        setValidationState({
          status: "success",
          message: `Webhook verified: ${result.webhookName}`,
        });
      } else {
        setValidationState({
          status: "error",
          message: result.error ?? "Invalid webhook",
        });
      }
    } catch {
      setValidationState({
        status: "error",
        message: "Failed to validate webhook. Please try again.",
      });
    }
  }, []);

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
              loading={validationState.status === "validating"}
              disabled={!form.values.webhookUrl.trim()}
              data-testid="validate-webhook-button"
            >
              Test
            </Button>
          }
          rightSectionWidth={60}
        />

        {validationState.status === "success" && (
          <Alert
            color="green"
            variant="light"
            data-testid="webhook-validation-success"
          >
            {validationState.message}
          </Alert>
        )}

        {validationState.status === "error" && (
          <Alert
            color="red"
            variant="light"
            data-testid="webhook-validation-error"
          >
            {validationState.message}
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
