import {
  TextInput,
  Button,
  Stack,
  Group,
  Switch,
  TagsInput,
  NumberInput,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";

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
}

export function ConfigForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Save",
  isEditing = false,
}: ConfigFormProps) {
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
