export function KanjiListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className="flex w-full flex-col gap-3 overflow-hidden rounded-base border-2 border-border bg-blank p-3 shadow-[3px_3px_0_var(--border)] sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
        >
          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            <div className="h-10 w-20 shrink-0 animate-pulse rounded-base border-2 border-border bg-main" />
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:justify-start">
              <div className="h-7 w-20 animate-pulse rounded-base border-2 border-border bg-blank" />
              <div className="h-7 w-16 animate-pulse rounded-base border-2 border-border bg-blank" />
              <div className="h-7 w-24 animate-pulse rounded-base border-2 border-border bg-blank" />
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-2 border-t-2 border-border pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
            <div className="flex items-center gap-2">
              <div className="h-10 w-24 animate-pulse rounded-base border-2 border-border bg-blank sm:w-10" />
              <div className="h-10 w-24 animate-pulse rounded-base border-2 border-border bg-blank sm:w-10" />
            </div>
            <div className="h-10 w-24 animate-pulse rounded-base border-2 border-border bg-danger sm:w-10" />
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
