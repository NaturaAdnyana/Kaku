import { Search } from "lucide-react";

import type { ListType, SavedListItem } from "@/components/kanji-list/types";
import { formatLocalIsoDate } from "@/components/kanji-list/utils";
import { cn, getSearchCountColor } from "@/lib/utils";

export function SavedListItemMeta({
  item,
  type,
}: {
  item: SavedListItem;
  type: ListType;
}) {
  const updatedLabel = formatLocalIsoDate(item.updatedAt);
  const linkedWordCount = item.wordCount ?? 0;

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 text-right text-[11px] font-black sm:justify-start sm:text-left">
      <span
        className={cn(
          "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-base border-2 border-border px-2.5 leading-none",
          getSearchCountColor(item.searchCount),
        )}
        title="Search count"
      >
        <Search size={12} className="shrink-0" />
        {item.searchCount} hits
      </span>
      {type === "kanji" && (
        <span
          className="inline-flex h-7 shrink-0 items-center rounded-base border-2 border-border bg-blank px-2.5 leading-none text-foreground"
          title="Saved words linked to this kanji"
        >
          {linkedWordCount} {linkedWordCount === 1 ? "word" : "words"}
        </span>
      )}
      <span
        className="inline-flex h-7 shrink-0 items-center rounded-base border-2 border-border bg-blank px-2.5 leading-none text-foreground"
        title="Last updated"
      >
        {updatedLabel}
      </span>
    </div>
  );
}
