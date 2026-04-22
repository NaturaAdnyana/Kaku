"use client";

import { Check, ChevronRight, ChevronUp, Eye, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  getPrimaryJishoDefinition,
  getPrimaryJishoReading,
  type JishoEntry,
} from "@/lib/jisho";
import { useSavedWordCardInteractions } from "@/components/useSavedWordCardInteractions";

type WordCardProps = {
  word: string;
  isSaved?: boolean;
  searchCount?: number;
  initialEntry?: JishoEntry | null;
  compareSourceWord?: string;
};

export function WordDetailCard({
  word,
  isSaved,
  searchCount,
  initialEntry,
  compareSourceWord,
}: WordCardProps) {
  const router = useRouter();
  const {
    entry,
    isExpanded,
    isFetching,
    isCompareSelected,
    toggleExpanded,
    toggleCompare,
  } = useSavedWordCardInteractions({
    word,
    compareSourceWord,
    initialEntry,
  });

  const reading = getPrimaryJishoReading(entry);
  const definition = getPrimaryJishoDefinition(entry);
  const handleCardOpen = () => {
    router.push(`/kanji/${encodeURIComponent(word)}`);
  };

  return (
    <div
      role="link"
      tabIndex={0}
      className="group relative flex w-full cursor-pointer flex-col gap-3 rounded-base border-2 border-border bg-blank p-3 pr-12 shadow-[4px_4px_0_var(--border)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
      onClick={handleCardOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleCardOpen();
        }
      }}
    >
      <ChevronRight
        size={18}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
      <div className="flex items-start gap-3 md:gap-4">
        {/* Word Container: Plain for Saved, Boxed for Dictionary */}
        <div
          className={cn(
            "text-2xl md:text-3xl font-bold font-jp p-2 flex shrink-0 items-center justify-center text-foreground",
            !isSaved &&
              "border-2 border-border rounded-base shadow-[2px_2px_0_var(--border)] bg-secondary",
          )}
        >
          {word}
        </div>

        {/* Center content container carefully scaled to prevent flex overflow */}
        {/* Buttons strictly pinned to the right */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {compareSourceWord && (
            <button
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleCompare();
              }}
              className={cn(
                "flex items-center gap-2 p-1.5 px-3 md:p-2 md:px-4 border-2 border-border rounded-base text-foreground transition-all cursor-pointer shrink-0 group",
                isCompareSelected
                  ? "bg-main text-main-foreground shadow-[2px_2px_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                  : "bg-secondary shadow-[2px_2px_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none",
              )}
              aria-label={
                isCompareSelected ? "Remove from compare" : "Add to compare"
              }
            >
              <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:block">
                {isCompareSelected ? "Added" : "Compare"}
              </span>
              {isCompareSelected ? (
                <Check size={18} className="group-active:text-main-foreground" />
              ) : (
                <Scale size={18} className="group-active:text-main-foreground" />
              )}
            </button>
          )}

          {isSaved && (
            <button
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleExpanded();
              }}
              disabled={isFetching}
              className="flex items-center gap-2 p-1.5 px-3 md:p-2 md:px-4 border-2 border-border bg-secondary shadow-[2px_2px_0_var(--border)] rounded-base text-foreground hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer active:bg-main active:text-main-foreground shrink-0 group"
              aria-label={isExpanded ? "Hide meaning" : "Reveal meaning"}
            >
              {isFetching ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isExpanded ? (
                <>
                  <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:block">
                    Hide
                  </span>
                  <ChevronUp size={18} className="group-active:text-main-foreground" />
                </>
              ) : (
                <>
                  <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:block">
                    Reveal
                  </span>
                  <Eye size={18} className="group-active:text-main-foreground" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-col justify-center overflow-hidden">
        {!isSaved && entry ? (
          <>
            {reading && (
              <span className="text-xs text-foreground font-bold font-jp truncate">
                {reading}
              </span>
            )}
            {definition && (
              <p className="mt-0.5 w-full truncate text-sm font-medium text-foreground/80">
                {definition}
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {searchCount && searchCount > 1 && (
              <span className="whitespace-nowrap rounded-sm border-2 border-border bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                Hits: {searchCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Spilled Meaning Dropdown */}
      {isSaved && isExpanded && entry && (
        <div className="pt-3 border-t-2 border-border/50 animate-in fade-in slide-in-from-top-2 flex flex-col gap-1.5">
          {reading && (
            <span className="text-xs text-foreground font-bold font-jp">
              {reading}
            </span>
          )}
          {definition && (
            <p className="text-sm text-foreground/90 font-medium break-words whitespace-normal">
              {definition}
            </p>
          )}
        </div>
      )}
      {isSaved && isExpanded && !entry && !isFetching && (
        <div className="pt-3 border-t-2 border-border/50 animate-in fade-in slide-in-from-top-2">
          <p className="text-sm text-muted-foreground italic">
            No definition found.
          </p>
        </div>
      )}
    </div>
  );
}
