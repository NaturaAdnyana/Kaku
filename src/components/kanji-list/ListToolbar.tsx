"use client";

import { ArrowDownAZ, Calendar } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { SortBy } from "@/components/kanji-list/types";

function ListSortValue({ sortBy }: { sortBy: SortBy }) {
  const isNewest = sortBy === "newest";

  return (
    <div className="pointer-events-none flex items-center gap-1.5">
      {isNewest ? (
        <Calendar
          size={14}
          className="shrink-0 text-blue-500 dark:text-sky-300"
        />
      ) : (
        <ArrowDownAZ
          size={14}
          className="shrink-0 text-orange-500 dark:text-amber-300"
        />
      )}
      <span className="truncate">
        {isNewest ? "Newest First" : "Most Searched"}
      </span>
    </div>
  );
}

export function ListToolbar({
  total,
  collectionLabel,
  showResultsLabel,
  sortBy,
  onSortChange,
}: {
  total: number;
  collectionLabel: string;
  showResultsLabel: boolean;
  sortBy: SortBy;
  onSortChange: (value: SortBy) => void;
}) {
  return (
    <div className="sticky top-0 z-10 mb-4 pt-2 pb-2">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-base border-2 border-border bg-main px-3 py-1 text-sm font-bold tabular-nums text-main-foreground shadow-shadow">
            <span>{total}</span>
            <span className="font-normal opacity-80">
              {showResultsLabel ? "results" : collectionLabel}
            </span>
          </span>
        </div>

        <Select
          value={sortBy}
          onValueChange={(value) => {
            if (value === "newest" || value === "most-searched") {
              onSortChange(value);
            }
          }}
        >
          <SelectTrigger className="h-10 w-auto px-4">
            <ListSortValue sortBy={sortBy} />
          </SelectTrigger>
          <SelectContent align="end" className="min-w-44 rounded-base p-1">
            <SelectItem value="newest" className="mb-1.5 rounded-base">
              <div className="flex items-center gap-2 py-0.5">
                <Calendar
                  size={14}
                  className="text-blue-500 dark:text-sky-300"
                />
                <span>Newest First</span>
              </div>
            </SelectItem>
            <SelectItem value="most-searched" className="rounded-base">
              <div className="flex items-center gap-2 py-0.5">
                <ArrowDownAZ
                  size={14}
                  className="text-orange-500 dark:text-amber-300"
                />
                <span>Most Searched</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

