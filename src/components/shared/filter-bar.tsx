"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchInput } from "./search-input";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  filters?: FilterConfig[];
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}

export function FilterBar({ filters, onSearch, searchPlaceholder, children }: FilterBarProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap mb-4">
      {filters?.map((filter) => (
        <Select key={filter.key} value={filter.value} onValueChange={filter.onChange}>
          <SelectTrigger className="w-[160px] h-9 text-[13px]">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {children}
      {onSearch && (
        <div className="ml-auto">
          <SearchInput
            onSearch={onSearch}
            placeholder={searchPlaceholder}
            className="w-[240px]"
          />
        </div>
      )}
    </div>
  );
}
