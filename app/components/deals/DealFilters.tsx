import { Group, Select, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

export type DateRange = "today" | "7days" | "30days" | "all";

export interface DealFiltersProps {
  searchTerms: string[];
  selectedSearchTerm: string | null;
  onSearchTermChange: (value: string | null) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (value: DateRange) => void;
}

const dateRangeOptions = [
  { value: "today", label: "Today" },
  { value: "7days", label: "Last 7 days" },
  { value: "30days", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

export function DealFilters({
  searchTerms,
  selectedSearchTerm,
  onSearchTermChange,
  searchQuery,
  onSearchQueryChange,
  dateRange,
  onDateRangeChange,
}: DealFiltersProps) {
  const searchTermOptions = [
    { value: "", label: "All search terms" },
    ...searchTerms.map((term) => ({ value: term, label: term })),
  ];

  return (
    <Group gap="md" data-testid="deal-filters">
      <Select
        placeholder="Filter by date"
        data={dateRangeOptions}
        value={dateRange}
        onChange={(value) => onDateRangeChange((value as DateRange) || "7days")}
        w={140}
        data-testid="date-range-filter"
      />
      <Select
        placeholder="Filter by search term"
        data={searchTermOptions}
        value={selectedSearchTerm || ""}
        onChange={onSearchTermChange}
        clearable
        w={200}
        data-testid="search-term-filter"
      />
      <TextInput
        placeholder="Search deals..."
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.currentTarget.value)}
        w={250}
        data-testid="search-query-input"
      />
    </Group>
  );
}
