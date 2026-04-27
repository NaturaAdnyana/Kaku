"use client";

import {
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import {
  useCompareWords,
  type CompareWordsContextMode,
} from "@/components/CompareWordsProvider";
import {
  CompareWordButton,
  RevealMeaningButton,
} from "@/components/word-detail-card/WordCardControls";
import {
  ExpandedMeaning,
  WordBadge,
  WordMetadata,
} from "@/components/word-detail-card/WordCardContent";
import { getJishoDefinition } from "@/app/actions/kanji";
import {
  getPrimaryJishoDefinition,
  getPrimaryJishoReading,
  type JishoEntry,
} from "@/lib/jisho";
import { cn } from "@/lib/utils";

type WordCardProps = {
  word: string;
  isSaved?: boolean;
  searchCount?: number;
  savedDate?: string;
  initialEntry?: JishoEntry | null;
  compareSourceWord?: string;
  compareScopeKey?: string;
  comparePagePath?: string;
  compareContext?: CompareWordsContextMode;
  leadingActionSlot?: ReactNode;
  actionSlot?: ReactNode;
  metaSlot?: ReactNode;
  expandedSlot?: ReactNode;
  showExpandedSlot?: boolean;
  onCardClick?: () => void;
  title?: string;
  hideDetailButton?: boolean;
  showRevealButton?: boolean;
  layout?: "default" | "saved-list";
};

export function WordDetailCard({
  word,
  isSaved,
  searchCount,
  savedDate,
  initialEntry,
  compareSourceWord,
  compareScopeKey,
  comparePagePath,
  compareContext = "detail",
  leadingActionSlot,
  actionSlot,
  metaSlot,
  expandedSlot,
  showExpandedSlot,
  onCardClick,
  title,
  hideDetailButton,
  showRevealButton = isSaved,
  layout = "default",
}: WordCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [entry, setEntry] = useState<JishoEntry | null>(initialEntry ?? null);
  const { isSelected, toggleWord } = useCompareWords();

  const compareScope = useMemo(() => {
    if (!compareSourceWord) return null;

    return {
      key: compareScopeKey ?? `kanji:${compareSourceWord}`,
      pagePath:
        comparePagePath ?? `/kanji/${encodeURIComponent(compareSourceWord)}`,
      routeWord: compareSourceWord,
      context: compareContext,
    };
  }, [compareContext, comparePagePath, compareScopeKey, compareSourceWord]);

  const reading = getPrimaryJishoReading(entry);
  const definition = getPrimaryJishoDefinition(entry);
  const isCompareSelected =
    compareScope !== null && isSelected(word, compareScope.key);
  const isCardClickable = onCardClick !== undefined;
  const isSavedListLayout = layout === "saved-list";
  const shouldShowExpandedContent = Boolean(
    (isSaved && isExpanded) || showExpandedSlot,
  );

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isCardClickable || event.target !== event.currentTarget) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onCardClick();
    }
  };

  const handleCompareToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (compareScope) {
      toggleWord(word, compareScope);
    }
  };

  const fetchMeaning = async () => {
    if (entry) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsFetching(true);
    try {
      const res = await getJishoDefinition(word);
      if (res.success && res.data) {
        setEntry(res.data as JishoEntry);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetching(false);
      setIsExpanded(true);
    }
  };

  const hasActions = Boolean(
    leadingActionSlot ||
      compareScope ||
      showRevealButton ||
      actionSlot ||
      !hideDetailButton,
  );

  const metadataContent = (
    <WordMetadata
      isSaved={isSaved}
      reading={reading}
      definition={definition}
      searchCount={searchCount}
      metaSlot={metaSlot}
    />
  );
  const expandedContent =
    expandedSlot ?? (
      <ExpandedMeaning
        isExpanded={isExpanded}
        isFetching={isFetching}
        isSaved={isSaved}
        reading={reading}
        definition={definition}
        hasEntry={entry !== null}
      />
    );

  return (
    <div
      role={isCardClickable ? "link" : undefined}
      tabIndex={isCardClickable ? 0 : undefined}
      title={title}
      onClick={onCardClick}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "group/card relative flex w-full flex-col rounded-base border-2 border-border bg-blank shadow-shadow transition-all",
        isCardClickable &&
          "cursor-pointer hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
      )}
    >
      {/* ── Header: Word badge + metadata ── */}
      <div className="flex items-center gap-3 p-3 md:gap-4 md:p-4">
        <WordBadge
          word={word}
          isSaved={isSaved}
          variant={isSavedListLayout ? "saved-list" : "default"}
        />

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {metadataContent}

          {savedDate && (
            <span className="inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-base border-2 border-border bg-blank px-2.5 text-[11px] font-black leading-none text-foreground">
              {savedDate}
            </span>
          )}
        </div>
      </div>

      {/* ── Action toolbar ── */}
      {hasActions && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 border-t-2 border-dashed border-border/40 px-3 py-2.5 md:px-4",
            hideDetailButton ? "justify-end" : "justify-between",
          )}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <div className="flex flex-wrap items-center gap-2">
            {leadingActionSlot}

            {compareScope && (
              <CompareWordButton
                isSelected={isCompareSelected}
                onClick={handleCompareToggle}
              />
            )}

            {showRevealButton && (
              <RevealMeaningButton
                isExpanded={isExpanded}
                isFetching={isFetching}
                onClick={(event) => {
                  event.stopPropagation();
                  void fetchMeaning();
                }}
              />
            )}

            {actionSlot}
          </div>

          {!hideDetailButton && (
            <Link
              href={`/kanji/${encodeURIComponent(word)}`}
              className="group/detail flex h-9 shrink-0 items-center gap-1.5 rounded-base border-2 border-border bg-main px-3 text-[10px] font-black uppercase tracking-[0.12em] text-main-foreground shadow-[2px_2px_0_var(--border)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              aria-label="Go to word details"
              onClick={(event) => event.stopPropagation()}
            >
              <span>Detail</span>
              <ChevronRight
                size={14}
                className="transition-transform group-hover/detail:translate-x-0.5"
              />
            </Link>
          )}
        </div>
      )}

      {/* ── Expanded content ── */}
      {shouldShowExpandedContent && (
        <div className="border-t-2 border-border px-3 py-3 md:px-4">
          {expandedContent}
        </div>
      )}
    </div>
  );
}
