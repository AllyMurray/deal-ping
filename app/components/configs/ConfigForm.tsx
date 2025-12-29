import { useState, useEffect, useCallback } from "react";
import {
  TextInput,
  Button,
  Stack,
  Group,
  Switch,
  TagsInput,
  NumberInput,
  Text,
  Alert,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useDebouncedValue } from "@mantine/hooks";
import type { DuplicateSearchTermInfo } from "~/db/repository.server";

export interface ConfigFormValues {
  searchTerm: string;
  enabled: boolean;
  includeKeywords: string[];
  excludeKeywords: string[];
  caseSensitive: boolean;
  maxPrice?: number | null; // Price in pounds (e.g., 50.00)
  minDiscount?: number | null; // Discount percentage (e.g., 30)
}

export interface ConfigFormProps {
  initialValues?: Partial<ConfigFormValues>;
  onSubmit: (values: ConfigFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  isEditing?: boolean;
  channelId?: string;
}

export function ConfigForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Save",
  isEditing = false,
  channelId,
}: ConfigFormProps) {
  const [duplicates, setDuplicates] = useState<DuplicateSearchTermInfo[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  const form = useForm<ConfigFormValues>({
    initialValues: {
      searchTerm: "",
      enabled: true,
      includeKeywords: [],
      excludeKeywords: [],
      caseSensitive: false,
      maxPrice: null,
      minDiscount: null,
      ...initialValues,
    },
    validate: {
      searchTerm: (value) =>
        value.trim().length < 1 ? "Search term is required" : null,
      maxPrice: (value) =>
        value !== null && value !== undefined && value < 0
          ? "Price must be positive"
          : null,
      minDiscount: (value) =>
        value !== null && value !== undefined && (value < 0 || value > 100)
          ? "Discount must be between 0 and 100"
          : null,
    },
  });

  const [debouncedSearchTerm] = useDebouncedValue(form.values.searchTerm, 300);

  const checkDuplicates = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim() || isEditing) {
        setDuplicates([]);
        return;
      }

      setIsCheckingDuplicates(true);
      try {
        const params = new URLSearchParams({ searchTerm: searchTerm.trim() });
        if (channelId) {
          params.set("channelId", channelId);
        }
        const response = await fetch(`/api/configs/check-duplicates?${params}`);
        if (response.ok) {
          const data = await response.json();
          setDuplicates(data.duplicates || []);
        }
      } catch {
        // Silently fail - duplicate check is non-critical
      } finally {
        setIsCheckingDuplicates(false);
      }
    },
    [channelId, isEditing]
  );

  useEffect(() => {
    checkDuplicates(debouncedSearchTerm);
  }, [debouncedSearchTerm, checkDuplicates]);

  return (
    <form onSubmit={form.onSubmit(onSubmit)} data-testid="config-form">
      <Stack gap="md">
        <TextInput
          label="Search Term"
          placeholder="e.g., steam-deck, ps5, nintendo"
          required
          disabled={isEditing}
          data-testid="search-term-input"
          {...form.getInputProps("searchTerm")}
        />

        {duplicates.length > 0 && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            color="yellow"
            variant="light"
            data-testid="duplicate-warning"
          >
            This search term is already used in:{" "}
            {duplicates.map((d, i) => (
              <span key={d.channelId}>
                <strong>{d.channelName}</strong>
                {i < duplicates.length - 1 ? ", " : ""}
              </span>
            ))}
            . You can still add it, but you may receive duplicate notifications.
          </Alert>
        )}

        <Switch
          label="Enabled"
          description="Receive notifications for this search term"
          data-testid="enabled-switch"
          {...form.getInputProps("enabled", { type: "checkbox" })}
        />

        <TagsInput
          label="Include Keywords"
          placeholder="Press Enter to add"
          description="Deals must contain at least one of these words"
          data-testid="include-keywords-input"
          {...form.getInputProps("includeKeywords")}
        />

        <TagsInput
          label="Exclude Keywords"
          placeholder="Press Enter to add"
          description="Exclude deals containing any of these words"
          data-testid="exclude-keywords-input"
          {...form.getInputProps("excludeKeywords")}
        />

        <Switch
          label="Case Sensitive"
          description="Match keywords with exact case"
          data-testid="case-sensitive-switch"
          {...form.getInputProps("caseSensitive", { type: "checkbox" })}
        />

        <Text size="sm" fw={500} mt="md">
          Price Thresholds
        </Text>
        <Text size="xs" c="dimmed" mb="xs">
          Only receive notifications when deals meet these criteria
        </Text>

        <Group grow>
          <NumberInput
            label="Maximum Price"
            placeholder="e.g., 50"
            description="Only notify if price is under this amount"
            prefix="£"
            min={0}
            decimalScale={2}
            allowNegative={false}
            data-testid="max-price-input"
            {...form.getInputProps("maxPrice")}
          />

          <NumberInput
            label="Minimum Discount"
            placeholder="e.g., 30"
            description="Only notify if discount is at least this %"
            suffix="%"
            min={0}
            max={100}
            allowNegative={false}
            data-testid="min-discount-input"
            {...form.getInputProps("minDiscount")}
          />
        </Group>

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
    </form>
  );
}
