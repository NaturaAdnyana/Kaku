"use client";

import { ChevronUp, Eye } from "lucide-react";

import type { KanjiApiDetails } from "@/app/actions/kanji";

export function KanjiPeekButton({
  isExpanded,
  isFetching,
  onClick,
}: {
  isExpanded: boolean;
  isFetching: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isFetching}
      className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-base border-2 border-border bg-background px-3 text-[10px] font-black uppercase tracking-[0.12em] text-foreground shadow-[2px_2px_0_var(--border)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-secondary hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:bg-main active:text-main-foreground active:shadow-none disabled:cursor-wait"
      aria-label={isExpanded ? "Hide kanji details" : "Reveal kanji details"}
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

function ReadingBlock({ label, values }: { label: string; values?: string[] }) {
  return (
    <div className="min-w-0 rounded-base border-2 border-border bg-blank px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words font-jp text-sm font-black text-foreground">
        {values && values.length > 0 ? values.join(" · ") : "—"}
      </p>
    </div>
  );
}

export function KanjiPeekContent({
  data,
  isFetching,
}: {
  data: KanjiApiDetails | null;
  isFetching: boolean;
}) {
  if (isFetching && !data) {
    return (
      <div className="rounded-base border-2 border-border bg-background p-3 shadow-[2px_2px_0_var(--border)]">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="h-14 animate-pulse rounded-base bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-14 animate-pulse rounded-base bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-base border-2 border-border bg-background p-3 shadow-[2px_2px_0_var(--border)]">
        <p className="text-sm font-semibold italic text-muted-foreground">
          No kanji details found.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-base border-2 border-border bg-background p-3 shadow-[2px_2px_0_var(--border)]">
      <p className="break-words text-sm font-black text-foreground">
        {data.meanings?.length ? data.meanings.join(", ") : "No meaning found"}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <ReadingBlock label="Onyomi" values={data.on_readings} />
        <ReadingBlock label="Kunyomi" values={data.kun_readings} />
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-black text-muted-foreground">
        {data.stroke_count != null && (
          <span className="rounded-base border-2 border-border bg-blank px-2 py-1">
            {data.stroke_count} strokes
          </span>
        )}
        {data.grade != null && (
          <span className="rounded-base border-2 border-border bg-blank px-2 py-1">
            Grade {data.grade}
          </span>
        )}
        {data.jlpt != null && (
          <span className="rounded-base border-2 border-border bg-blank px-2 py-1">
            JLPT N{data.jlpt}
          </span>
        )}
      </div>
    </div>
  );
}
