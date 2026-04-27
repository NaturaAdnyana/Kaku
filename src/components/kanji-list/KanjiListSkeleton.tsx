/**
 * Skeleton for the saved‑list variant of WordDetailCard.
 * Matches the current card layout:
 *   Header  → word text + meta pills (hits, date)
 *   Divider → dashed border
 *   Toolbar → action buttons right‑aligned
 */
export function KanjiListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className="flex w-full flex-col rounded-base border-2 border-border bg-blank shadow-shadow"
        >
          {/* ── Header: word + pills ── */}
          <div className="flex items-center gap-3 p-3 md:gap-4 md:p-4">
            <div className="h-10 w-16 shrink-0 animate-pulse rounded bg-secondary" />
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <div className="h-7 w-16 animate-pulse rounded-base border-2 border-border bg-blank" />
              <div className="h-7 w-20 animate-pulse rounded-base border-2 border-border bg-blank" />
            </div>
          </div>

          {/* ── Action toolbar ── */}
          <div className="flex items-center justify-end gap-2 border-t-2 border-dashed border-border/40 px-3 py-2.5 md:px-4">
            <div className="h-9 w-24 animate-pulse rounded-base border-2 border-border bg-blank" />
            <div className="h-9 w-24 animate-pulse rounded-base border-2 border-border bg-blank" />
            <div className="h-9 w-20 animate-pulse rounded-base border-2 border-border bg-danger/30" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function KanjiSkeleton() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="h-8 w-32 animate-pulse rounded-base border-2 border-border bg-blank" />
        <div className="h-10 w-36 animate-pulse rounded-base border-2 border-border bg-blank" />
      </div>
      <KanjiListSkeleton />
    </div>
  );
}
