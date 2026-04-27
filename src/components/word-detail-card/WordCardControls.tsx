"use client";

import { Check, ChevronUp, Eye, Scale } from "lucide-react";

import { cn } from "@/lib/utils";

const BTN_BASE =
  "flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-base border-2 border-border text-[10px] font-black uppercase tracking-[0.12em] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

const BTN_SHADOW =
  "shadow-[2px_2px_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none";

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
          BTN_BASE,
          BTN_SHADOW,
          "px-2.5",
          isSelected
            ? "bg-main text-main-foreground"
            : "bg-background text-foreground hover:bg-secondary",
        )}
        aria-label={isSelected ? "Remove from compare" : "Add to compare"}
      >
        <span>{isSelected ? "Added" : "Compare"}</span>
        {isSelected ? (
          <Check size={14} className="shrink-0" />
        ) : (
          <Scale size={14} className="shrink-0" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        BTN_BASE,
        BTN_SHADOW,
        "cursor-pointer px-3",
        isSelected
          ? "bg-main text-main-foreground"
          : "bg-background text-foreground hover:bg-secondary",
      )}
      aria-label={isSelected ? "Remove from compare" : "Add to compare"}
    >
      <span>{isSelected ? "Added" : "Compare"}</span>
      {isSelected ? (
        <Check size={14} className="shrink-0" />
      ) : (
        <Scale size={14} className="shrink-0" />
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
        className={cn(
          BTN_BASE,
          BTN_SHADOW,
          "bg-background px-2.5 text-foreground hover:bg-secondary disabled:cursor-wait",
        )}
        aria-label={isExpanded ? "Hide meaning" : "Reveal meaning"}
      >
        <span>{isExpanded ? "Hide" : "Reveal"}</span>
        {isFetching ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : isExpanded ? (
          <ChevronUp size={14} className="shrink-0" />
        ) : (
          <Eye size={14} className="shrink-0" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isFetching}
      className={cn(
        BTN_BASE,
        BTN_SHADOW,
        "cursor-pointer bg-background px-3 text-foreground hover:bg-secondary active:bg-main active:text-main-foreground disabled:cursor-wait",
      )}
      aria-label={isExpanded ? "Hide meaning" : "Reveal meaning"}
    >
      {isFetching ? (
        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : isExpanded ? (
        <>
          <span>Hide</span>
          <ChevronUp size={14} className="shrink-0" />
        </>
      ) : (
        <>
          <span>Reveal</span>
          <Eye size={14} className="shrink-0" />
        </>
      )}
    </button>
  );
}
