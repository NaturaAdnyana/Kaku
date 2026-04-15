"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronUp, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

import { getJishoDefinition } from "@/app/actions/kanji";

type WordCardProps = {
  word: string;
  isSaved?: boolean;
  searchCount?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialEntry?: any;
};

export function WordDetailCard({
  word,
  isSaved,
  searchCount,
  initialEntry,
}: WordCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [entry, setEntry] = useState<any>(initialEntry);

  const fetchMeaning = async () => {
    if (entry) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsFetching(true);
    try {
      const res = await getJishoDefinition(word);
      if (res.success && res.data) {
        setEntry(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetching(false);
      setIsExpanded(true);
    }
  };

  return (
    <div className="p-3 bg-blank border-2 border-border shadow-[4px_4px_0_var(--border)] rounded-base flex flex-col gap-3 transition-all relative w-full overflow-hidden">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Word Container: Plain for Saved, Boxed for Dictionary */}
        <div
          className={cn(
            "text-2xl md:text-3xl font-bold font-jp p-2 flex shrink-0 items-center justify-center text-foreground",
            !isSaved &&
              "border-2 border-border rounded-base shadow-[2px_2px_0_var(--border)] bg-secondary",
          )}
        >
          {word}
        </div>

        {/* Center content container carefully scaled to prevent flex overflow */}
        <div className="flex flex-col flex-1 min-w-0 justify-center overflow-hidden">
          {!isSaved && entry ? (
            <>
              <span className="text-xs text-foreground font-bold font-jp truncate">
                {entry.japanese?.[0]?.reading}
              </span>
              <p className="text-sm text-foreground/80 font-medium mt-0.5 truncate w-full">
                {entry.senses?.[0]?.english_definitions?.join(", ")}
              </p>
            </>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              {searchCount && searchCount > 1 && (
                <span className="px-1.5 py-0.5 bg-secondary text-foreground text-[10px] font-bold border-2 border-border rounded-sm whitespace-nowrap">
                  Hits: {searchCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Buttons strictly pinned to the right */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {isSaved && (
            <button
              onClick={fetchMeaning}
              disabled={isFetching}
              className="flex items-center gap-2 p-1.5 px-3 md:p-2 md:px-4 border-2 border-border bg-secondary shadow-[2px_2px_0_var(--border)] rounded-base text-foreground hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer active:bg-main active:text-main-foreground shrink-0 group"
              aria-label={isExpanded ? "Hide meaning" : "Reveal meaning"}
            >
              {isFetching ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isExpanded ? (
                <>
                  <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:block">
                    Hide
                  </span>
                  <ChevronUp size={18} className="group-active:text-main-foreground" />
                </>
              ) : (
                <>
                  <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:block">
                    Reveal
                  </span>
                  <Eye size={18} className="group-active:text-main-foreground" />
                </>
              )}
            </button>
          )}

          <Link
            href={`/kanji/${encodeURIComponent(word)}`}
            className="p-1.5 md:p-2 border-2 border-border bg-main text-main-foreground shadow-[2px_2px_0_var(--border)] rounded-base hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer flex shrink-0 items-center justify-center"
            aria-label="Go to word details"
          >
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      {/* Spilled Meaning Dropdown */}
      {isSaved && isExpanded && entry && (
        <div className="pt-3 border-t-2 border-border/50 animate-in fade-in slide-in-from-top-2 flex flex-col gap-1.5">
          <span className="text-xs text-foreground font-bold font-jp">
            {entry.japanese?.[0]?.reading}
          </span>
          <p className="text-sm text-foreground/90 font-medium break-words whitespace-normal">
            {entry.senses?.[0]?.english_definitions?.join(", ")}
          </p>
        </div>
      )}
      {isSaved && isExpanded && !entry && !isFetching && (
        <div className="pt-3 border-t-2 border-border/50 animate-in fade-in slide-in-from-top-2">
          <p className="text-sm text-muted-foreground italic">
            No definition found.
          </p>
        </div>
      )}
    </div>
  );
}
