import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function WordBadge({
  word,
  isSaved,
  variant,
}: {
  word: string;
  isSaved?: boolean;
  variant: "default" | "saved-list";
}) {
  const wordLength = Array.from(word).length;

  if (variant === "saved-list") {
    return (
      <span
        className={cn(
          "flex min-h-12 shrink-0 items-center whitespace-nowrap px-1 py-2 font-jp font-black leading-none text-foreground",
          wordLength > 5 ? "text-xl" : wordLength > 2 ? "text-2xl" : "text-3xl",
        )}
      >
        {word}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex min-h-12 min-w-12 max-w-[44%] shrink-0 items-center break-words px-1 py-2 font-jp font-black leading-none md:min-h-14 md:min-w-14",
        isSaved ? "text-main-foreground" : "text-foreground",
        wordLength > 5
          ? "text-lg"
          : wordLength > 2
            ? "text-xl md:text-2xl"
            : "text-2xl md:text-3xl",
      )}
    >
      {word}
    </span>
  );
}

export function WordMetadata({
  isSaved,
  reading,
  definition,
  searchCount,
  metaSlot,
}: {
  isSaved?: boolean;
  reading?: string | null;
  definition?: string | null;
  searchCount?: number;
  metaSlot?: ReactNode;
}) {
  if (!isSaved && (reading || definition)) {
    return (
      <div className="flex min-w-0 flex-col gap-0.5">
        {reading && (
          <span className="truncate font-jp text-xs font-black text-foreground">
            {reading}
          </span>
        )}
        {definition && (
          <p className="w-full truncate text-sm font-semibold text-foreground/70">
            {definition}
          </p>
        )}
      </div>
    );
  }

  return (
    metaSlot ?? (
      <div className="flex flex-wrap items-center gap-2">
        {searchCount && searchCount > 1 && (
          <span className="whitespace-nowrap rounded-base border-2 border-border bg-secondary px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-foreground shadow-[2px_2px_0_var(--border)]">
            {searchCount} hits
          </span>
        )}
      </div>
    )
  );
}

export function ExpandedMeaning({
  isExpanded,
  isFetching,
  isSaved,
  reading,
  definition,
  hasEntry,
}: {
  isExpanded: boolean;
  isFetching: boolean;
  isSaved?: boolean;
  reading?: string | null;
  definition?: string | null;
  hasEntry: boolean;
}) {
  if (!isSaved || !isExpanded) return null;

  if (hasEntry) {
    return (
      <div className="animate-in slide-in-from-top-2 fade-in flex flex-col gap-1 rounded-base border-2 border-border bg-background p-3 shadow-[2px_2px_0_var(--border)]">
        {reading && (
          <span className="font-jp text-xs font-black text-foreground">
            {reading}
          </span>
        )}
        {definition && (
          <p className="break-words whitespace-normal text-sm font-semibold text-foreground/90">
            {definition}
          </p>
        )}
      </div>
    );
  }

  if (!isFetching) {
    return (
      <div className="animate-in slide-in-from-top-2 fade-in rounded-base border-2 border-border bg-background p-3 shadow-[2px_2px_0_var(--border)]">
        <p className="text-sm font-semibold italic text-muted-foreground">
          No definition found.
        </p>
      </div>
    );
  }

  return null;
}
