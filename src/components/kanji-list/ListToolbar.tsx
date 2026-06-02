"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowDownAZ, Calendar, ArrowUpDown, ListFilter, Folder, X } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SortBy } from "@/components/kanji-list/types";

export function ListToolbar({
  total,
  collectionLabel,
  showResultsLabel,
  sortBy,
  onSortChange,
  selectedFolderId,
  onFolderChange,
  selectedDateRange,
  onDateRangeChange,
  folders = [],
}: {
  total: number;
  collectionLabel: string;
  showResultsLabel: boolean;
  sortBy: SortBy;
  onSortChange: (value: SortBy) => void;
  selectedFolderId?: string;
  onFolderChange: (folderId: string | undefined) => void;
  selectedDateRange: "all" | "today" | "week" | "month";
  onDateRangeChange: (range: "all" | "today" | "week" | "month") => void;
  folders?: Array<{ id: string; name: string }>;
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const activeFiltersCount = (selectedFolderId ? 1 : 0) + (selectedDateRange !== "all" ? 1 : 0);

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

        <div className="flex items-center gap-2">
          <Select
            value={sortBy}
            onValueChange={(value) => {
              if (value === "newest" || value === "most-searched") {
                onSortChange(value);
              }
            }}
          >
            <SelectTrigger className="h-10 w-10 p-0 flex items-center justify-center [&_span:last-child]:hidden shrink-0 border-2 border-border bg-secondary-background shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all">
              <ArrowUpDown size={18} className="text-foreground" />
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

          <div className="relative" ref={popoverRef}>
            <Button
              variant="neutral"
              size="icon"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="relative h-10 w-10 p-0 flex items-center justify-center shrink-0"
              aria-label="Filter options"
            >
              <ListFilter size={18} />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white border-2 border-border shadow-[1px_1px_0px_rgba(0,0,0,1)] animate-in zoom-in">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            {isFilterOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-base border-2 border-border bg-blank p-4 shadow-shadow text-foreground animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="space-y-4">
                  {/* Folder Section */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 text-sm font-black uppercase tracking-wider text-muted-foreground">
                      <Folder size={14} />
                      <span>Folder</span>
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      <button
                        onClick={() => {
                          onFolderChange(undefined);
                        }}
                        className={cn(
                          "flex items-center gap-2 w-full text-left px-2 py-1.5 text-xs font-bold rounded-md transition-colors",
                          selectedFolderId === undefined
                            ? "bg-main text-main-foreground border-2 border-border shadow-[1px_1px_0px_rgba(0,0,0,1)]"
                            : "hover:bg-secondary-background border border-transparent"
                        )}
                      >
                        All Folders
                      </button>
                      {folders.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground px-2 py-1">No folders created.</p>
                      ) : (
                        folders.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => {
                              onFolderChange(f.id);
                            }}
                            className={cn(
                              "flex items-center gap-2 w-full text-left px-2 py-1.5 text-xs font-bold rounded-md transition-colors",
                              selectedFolderId === f.id
                                ? "bg-main text-main-foreground border-2 border-border shadow-[1px_1px_0px_rgba(0,0,0,1)]"
                                : "hover:bg-secondary-background border border-transparent"
                            )}
                          >
                            <Folder size={12} className="shrink-0" />
                            <span className="truncate">{f.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border my-2" />

                  {/* Date Saved Section */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 text-sm font-black uppercase tracking-wider text-muted-foreground">
                      <Calendar size={14} />
                      <span>Date Saved</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["all", "today", "week", "month"] as const).map((range) => (
                        <button
                          key={range}
                          onClick={() => {
                            onDateRangeChange(range);
                          }}
                          className={cn(
                            "flex items-center justify-center px-2 py-1.5 text-xs font-bold rounded-md transition-colors capitalize",
                            selectedDateRange === range
                              ? "bg-main text-main-foreground border-2 border-border shadow-[1px_1px_0px_rgba(0,0,0,1)]"
                              : "hover:bg-secondary-background border border-transparent"
                          )}
                        >
                          {range === "all" ? "all time" : range}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(selectedFolderId !== undefined || selectedDateRange !== "all") && (
                    <>
                      <div className="border-t border-border my-2" />
                      <button
                        onClick={() => {
                          onFolderChange(undefined);
                          onDateRangeChange("all");
                        }}
                        className="flex items-center justify-center gap-1.5 w-full px-2 py-2 text-xs font-black text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/20 rounded-md transition-colors border border-dashed border-red-200 dark:border-red-900/30"
                      >
                        <X size={12} />
                        Reset Filters
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

