"use client";

import { Check, ChevronUp, Eye, Scale } from "lucide-react";

import { cn } from "@/lib/utils";

export function CompareWordButton({
  isSelected,
  compact,
  onClick,
}: {
  isSelected: boolean;
  compact?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group/btn flex h-10 min-w-10 items-center justify-center gap-2 rounded-base border-2 border-border px-3 text-xs font-black uppercase tracking-[0.12em] transition-all sm:w-10 sm:px-0",
          isSelected
            ? "bg-main text-main-foreground shadow-[2px_2px_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            : "bg-background text-foreground shadow-[2px_2px_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-secondary hover:shadow-none",
        )}
        aria-label={isSelected ? "Remove from compare" : "Add to compare"}
      >
        <span className="text-[10px] font-black uppercase tracking-[0.14em] sm:hidden">
          {isSelected ? "Added" : "Compare"}
        </span>
        {isSelected ? (
          <Check size={16} className="shrink-0" />
        ) : (
          <Scale size={16} className="shrink-0" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-base border-2 border-border p-1.5 px-3 text-foreground transition-all md:p-2 md:px-4",
        isSelected
          ? "bg-main text-main-foreground shadow-[2px_2px_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          : "bg-background shadow-[2px_2px_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-secondary hover:shadow-none",
      )}
      aria-label={isSelected ? "Remove from compare" : "Add to compare"}
    >
      <span className="hidden text-[10px] font-black uppercase tracking-[0.14em] sm:block">
        {isSelected ? "Added" : "Compare"}
      </span>
      {isSelected ? (
        <Check size={18} className="group-active:text-main-foreground" />
      ) : (
        <Scale size={18} className="group-active:text-main-foreground" />
      )}
    </button>
  );
}

export function RevealMeaningButton({
  isExpanded,
  isFetching,
  compact,
  onClick,
}: {
  isExpanded: boolean;
  isFetching: boolean;
  compact?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isFetching}
        className="group/btn flex h-10 min-w-10 items-center justify-center gap-2 rounded-base border-2 border-border bg-background px-3 text-xs font-black uppercase tracking-[0.12em] text-foreground shadow-[2px_2px_0_var(--border)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-secondary hover:shadow-none active:bg-main active:text-main-foreground disabled:cursor-wait sm:w-10 sm:px-0"
        aria-label={isExpanded ? "Hide meaning" : "Peek meaning"}
      >
        <span className="text-[10px] font-black uppercase tracking-[0.14em] sm:hidden">
          {isExpanded ? "Hide" : "Peek"}
        </span>
        {isFetching ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : isExpanded ? (
          <ChevronUp size={16} className="shrink-0" />
        ) : (
          <Eye size={16} className="shrink-0" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isFetching}
      className="group flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-base border-2 border-border bg-background p-1.5 px-3 text-foreground shadow-[2px_2px_0_var(--border)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-secondary hover:shadow-none active:bg-main active:text-main-foreground disabled:cursor-wait md:p-2 md:px-4"
      aria-label={isExpanded ? "Hide meaning" : "Reveal meaning"}
    >
      {isFetching ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : isExpanded ? (
        <>
          <span className="hidden text-[10px] font-black uppercase tracking-[0.14em] sm:block">
            Hide
          </span>
          <ChevronUp size={18} className="group-active:text-main-foreground" />
        </>
      ) : (
        <>
          <span className="hidden text-[10px] font-black uppercase tracking-[0.14em] sm:block">
            Reveal
          </span>
          <Eye size={18} className="group-active:text-main-foreground" />
        </>
      )}
    </button>
  );
}
