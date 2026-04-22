"use client";

import { Calendar, Check, ChevronRight, ChevronUp, Eye, Scale, Search, Trash2 } from "lucide-react";

import { useWordCardBehavior } from "@/components/useWordCardBehavior";
import { cn, getSearchCountColor } from "@/lib/utils";

type WordListRowCardProps = {
  word: string;
  searchCount: number;
  updatedLabel: string;
  onOpen: (word: string) => void;
  onDelete: (event: React.MouseEvent, word: string) => void;
  compareSourceWord?: string;
  itemRef?: ((node?: Element | null) => void) | null;
};

export function WordListRowCard({
  word,
  searchCount,
  updatedLabel,
  onOpen,
  onDelete,
  compareSourceWord,
  itemRef,
}: WordListRowCardProps) {
  const {
    definition,
    entry,
    isCompareSelected,
    isExpanded,
    isFetching,
    reading,
    toggleCompare,
    toggleReveal,
  } = useWordCardBehavior({
    word,
    compareSourceWord,
    allowReveal: true,
  });

  const handleReveal = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    await toggleReveal();
  };

  return (
    <div
      ref={itemRef}
      role="link"
      tabIndex={0}
      className="group flex cursor-pointer flex-col gap-3 rounded-base border-2 border-border bg-blank p-4 shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
      onClick={() => onOpen(word)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(word);
        }
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 min-w-12 shrink-0 items-center justify-center rounded-base border-2 border-border bg-main px-3">
          <span className="truncate font-jp text-2xl font-bold leading-none text-main-foreground">
            {word}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          {entry ? (
            <>
              {reading && (
                <span className="block truncate text-xs font-bold text-foreground">
                  {reading}
                </span>
              )}
              {definition && (
                <p className="truncate text-sm text-foreground/80">{definition}</p>
              )}
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-base border-2 border-border px-3 py-1 text-xs font-bold",
                  getSearchCountColor(searchCount),
                )}
              >
                <Search size={12} />
                {searchCount} {searchCount === 1 ? "search" : "searches"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-base border-2 border-border bg-secondary px-3 py-1 text-xs font-bold text-foreground">
                <Calendar size={12} className="opacity-70" />
                {updatedLabel}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {compareSourceWord && (
            <button
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleCompare();
              }}
              className={cn(
                "flex items-center gap-2 rounded-base border-2 border-border p-2 transition-all",
                isCompareSelected
                  ? "bg-main text-main-foreground shadow-[2px_2px_0_var(--border)]"
                  : "bg-secondary text-foreground shadow-[2px_2px_0_var(--border)]",
              )}
              aria-label={
                isCompareSelected ? "Remove from compare" : "Add to compare"
              }
            >
              {isCompareSelected ? <Check size={16} /> : <Scale size={16} />}
            </button>
          )}

          <button
            onClick={handleReveal}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary p-2 text-foreground shadow-[2px_2px_0_var(--border)] transition-all"
            aria-label={isExpanded ? "Hide meaning" : "Reveal meaning"}
          >
            {isFetching ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isExpanded ? (
              <ChevronUp size={16} />
            ) : (
              <Eye size={16} />
            )}
          </button>

          <button
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDelete(event, word);
            }}
            className="group/btn z-20 flex shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-border bg-danger p-2.5 font-bold text-white shadow-shadow transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
            title="Delete"
          >
            <Trash2
              size={14}
              className="transition-transform group-hover/btn:scale-110"
            />
          </button>

          <div className="rounded-base border-2 border-border bg-main p-2 text-main-foreground shadow-[2px_2px_0_var(--border)]">
            <ChevronRight size={16} />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t-2 border-border/50 pt-2">
          {entry ? (
            <>
              {reading && (
                <span className="text-xs font-bold text-foreground">{reading}</span>
              )}
              {definition && (
                <p className="text-sm font-medium text-foreground/90">{definition}</p>
              )}
            </>
          ) : !isFetching ? (
            <p className="text-sm italic text-muted-foreground">No definition found.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
