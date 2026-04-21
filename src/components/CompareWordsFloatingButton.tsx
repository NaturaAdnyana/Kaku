"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Scale } from "lucide-react";

import { useCompareWords } from "@/components/CompareWordsProvider";
import { cn } from "@/lib/utils";

function buildCompareHref(sourceWord: string, selectedWords: string[]) {
  const params = new URLSearchParams();
  selectedWords.forEach((word) => {
    params.append("compare", word);
  });

  return `/kanji/${encodeURIComponent(sourceWord)}/chat?${params.toString()}`;
}

export function CompareWordsFloatingButton() {
  const pathname = usePathname();
  const { sourceWord, selectedWords, clearCompare } = useCompareWords();

  if (!sourceWord || selectedWords.length === 0) {
    return null;
  }

  const sourcePath = `/kanji/${encodeURIComponent(sourceWord)}`;
  if (pathname !== sourcePath) {
    return null;
  }

  const canCompare = selectedWords.length >= 2;
  const helperText = canCompare
    ? selectedWords.join(" · ")
    : "Pick one more word to compare";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[55] flex justify-center px-4 sm:bottom-28">
      <div className="pointer-events-auto">
        <Link
          href={buildCompareHref(sourceWord, selectedWords)}
          onClick={(event) => {
            if (!canCompare) {
              event.preventDefault();
              return;
            }

            clearCompare();
          }}
          aria-disabled={!canCompare}
          className={cn(
            "flex items-center gap-3 rounded-2xl border-2 border-border bg-blank shadow-shadow transition-all",
            canCompare
              ? "min-w-[280px] max-w-[calc(100vw-2rem)] cursor-pointer px-4 py-3 hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
              : "max-w-[calc(100vw-2rem)] cursor-default px-3 py-2.5",
          )}
        >
          <div
            className={cn(
              "shrink-0 items-center justify-center rounded-xl border-2 border-border bg-main text-main-foreground shadow-[2px_2px_0_var(--border)]",
              canCompare ? "flex h-11 w-11" : "flex h-9 w-9",
            )}
          >
            <Scale className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
              Compare Words
            </p>
            {canCompare ? (
              <>
                <p className="mt-1 truncate text-sm font-bold text-foreground">
                  {selectedWords.length} selected
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {helperText}
                </p>
              </>
            ) : (
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                1 selected. Choose 1 more to compare.
              </p>
            )}
          </div>

          {canCompare && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-secondary text-foreground shadow-[2px_2px_0_var(--border)]">
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}
