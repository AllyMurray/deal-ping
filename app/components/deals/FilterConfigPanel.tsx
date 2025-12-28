import { Paper, Stack, Group, TagsInput, Switch, Text, Badge, Collapse, UnstyledButton, Box } from "@mantine/core";
import { IconFilter, IconChevronDown, IconChevronUp, IconEye } from "@tabler/icons-react";
import { useState } from "react";

export interface FilterConfigPanelProps {
  searchTerm: string;
  includeKeywords: string[];
  excludeKeywords: string[];
  caseSensitive: boolean;
  onIncludeKeywordsChange: (keywords: string[]) => void;
  onExcludeKeywordsChange: (keywords: string[]) => void;
  onCaseSensitiveChange: (value: boolean) => void;
  passedCount: number;
  filteredCount: number;
}

export function FilterConfigPanel({
  searchTerm,
  includeKeywords,
  excludeKeywords,
  caseSensitive,
  onIncludeKeywordsChange,
  onExcludeKeywordsChange,
  onCaseSensitiveChange,
  passedCount,
  filteredCount,
}: FilterConfigPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasFilters = includeKeywords.length > 0 || excludeKeywords.length > 0;

  return (
    <Paper
      p="md"
      withBorder
      data-testid="filter-config-panel"
      style={{
        borderColor: hasFilters ? 'var(--mantine-color-blue-4)' : undefined,
      }}
    >
      <UnstyledButton
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ width: '100%' }}
        data-testid="filter-panel-toggle"
      >
        <Group justify="space-between" mb={isExpanded ? 'md' : 0}>
          <Group gap="sm">
            <IconFilter size={20} stroke={1.5} />
            <div>
              <Group gap="xs">
                <Text fw={500}>Filter Preview</Text>
                <Badge variant="light" size="sm">
                  {searchTerm}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                Configure filters to see which deals would match
              </Text>
            </div>
          </Group>
          <Group gap="md">
            <Group gap="xs">
              <IconEye size={16} style={{ color: 'var(--mantine-color-green-6)' }} />
              <Badge variant="light" color="green" size="sm" data-testid="passed-count">
                {passedCount} passing
              </Badge>
              {filteredCount > 0 && (
                <Badge variant="light" color="gray" size="sm" data-testid="filtered-count">
                  {filteredCount} filtered
                </Badge>
              )}
            </Group>
            {isExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
          </Group>
        </Group>
      </UnstyledButton>

      <Collapse in={isExpanded}>
        <Stack gap="md">
          <TagsInput
            label="Include Keywords"
            placeholder="Press Enter to add keywords"
            description="Deals must contain ALL of these words to pass"
            value={includeKeywords}
            onChange={onIncludeKeywordsChange}
            data-testid="live-include-keywords"
          />

          <TagsInput
            label="Exclude Keywords"
            placeholder="Press Enter to add keywords"
            description="Deals containing ANY of these words will be filtered out"
            value={excludeKeywords}
            onChange={onExcludeKeywordsChange}
            data-testid="live-exclude-keywords"
          />

          <Switch
            label="Case Sensitive"
            description="Match keywords with exact case"
            checked={caseSensitive}
            onChange={(e) => onCaseSensitiveChange(e.currentTarget.checked)}
            data-testid="live-case-sensitive"
          />

          <Box
            style={{
              backgroundColor: 'var(--mantine-color-blue-light)',
              borderRadius: 'var(--mantine-radius-sm)',
              padding: 'var(--mantine-spacing-sm)',
            }}
          >
            <Text size="sm" c="blue">
              <strong>Preview Mode:</strong> These filters are applied in real-time to show you which deals would match.
              Filtered deals are shown greyed out below. To save these filters permanently, edit the search term configuration.
            </Text>
          </Box>
        </Stack>
      </Collapse>
    </Paper>
  );
}
