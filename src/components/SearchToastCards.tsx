"use client";

import { Flame, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";

type BaseSearchToastCardProps = {
  title: string;
  description: string;
  onClose?: () => void;
};

export function SearchAnalysisToastCard({
  title,
  description,
}: BaseSearchToastCardProps) {
  return (
    <div className="w-[352px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-500 dark:text-zinc-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-950 dark:text-zinc-50">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SearchResultToastCard({
  title,
  description,
  duration,
  level,
  onClose,
}: BaseSearchToastCardProps & {
  duration: number;
  level: number;
}) {
  return (
    <div className="w-[352px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
      <div className="relative flex items-start gap-3 p-4 pr-12">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
            level >= 4
              ? "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
          )}
        >
          {level >= 4 ? (
            <Flame className="h-5 w-5" />
          ) : (
            <span className="text-base font-bold">{level}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-950 dark:text-zinc-50">
            {description}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            aria-label="Close toast"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-900">
        <div
          className="h-full origin-left animate-toast-progress bg-zinc-900 dark:bg-zinc-100"
          style={{
            animationDuration: `${duration}ms`,
            animationTimingFunction: "linear",
          }}
        />
      </div>
    </div>
  );
}
