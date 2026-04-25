export function ListErrorState({
  entityLabel,
  onRetry,
}: {
  entityLabel: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-base border-2 border-dashed border-border bg-blank py-20 text-center text-red-500 shadow-shadow">
      <p>Failed to load saved {entityLabel}.</p>
      <button onClick={onRetry} className="mt-2 text-sm text-zinc-500 underline">
        Try again
      </button>
    </div>
  );
}

export function ListEmptyState({
  hasSearch,
  emptyLabel,
}: {
  hasSearch: boolean;
  emptyLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-base border-2 border-dashed border-border bg-blank py-20 text-center text-zinc-500 shadow-shadow dark:text-muted-foreground">
      <p>{hasSearch ? "No matches found." : emptyLabel}</p>
      {!hasSearch && (
        <p className="mt-2 text-sm">Go to the Write tab to start practicing!</p>
      )}
    </div>
  );
}

