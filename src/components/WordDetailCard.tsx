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

  const metadataContent = (
    <WordMetadata
      isSaved={isSaved}
      reading={reading}
      definition={definition}
      searchCount={searchCount}
      metaSlot={metaSlot}
    />
  );
  const expandedContent = (
    expandedSlot ?? (
      <ExpandedMeaning
        isExpanded={isExpanded}
        isFetching={isFetching}
        isSaved={isSaved}
        reading={reading}
        definition={definition}
        hasEntry={entry !== null}
      />
    )
  );

  if (isSavedListLayout) {
    return (
      <div
        role={isCardClickable ? "link" : undefined}
        tabIndex={isCardClickable ? 0 : undefined}
        title={title}
        onClick={onCardClick}
        onKeyDown={handleCardKeyDown}
        className={cn(
          "group/card relative flex w-full flex-col gap-3 overflow-hidden rounded-base border-2 border-border bg-blank p-3 shadow-[3px_3px_0_var(--border)] transition-all sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
          isCardClickable &&
            "cursor-pointer hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
        )}
      >
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <WordBadge word={word} isSaved={isSaved} variant="saved-list" />

          <div className="min-w-0 flex-1 overflow-hidden">{metadataContent}</div>
        </div>

        <div
          className="flex shrink-0 items-center justify-between gap-2 border-t-2 border-border pt-3 sm:justify-end sm:border-t-0 sm:pt-0"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-center gap-2">
            {leadingActionSlot}

            {compareScope && (
              <CompareWordButton
                compact
                isSelected={isCompareSelected}
                onClick={handleCompareToggle}
              />
            )}

            {showRevealButton && (
              <RevealMeaningButton
                compact
                isExpanded={isExpanded}
                isFetching={isFetching}
                onClick={(event) => {
                  event.stopPropagation();
                  void fetchMeaning();
                }}
              />
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {actionSlot}
          </div>
        </div>

        {shouldShowExpandedContent && (
          <div
            className="sm:col-span-2"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {expandedContent}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role={isCardClickable ? "link" : undefined}
      tabIndex={isCardClickable ? 0 : undefined}
      title={title}
      onClick={onCardClick}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "group/card relative flex w-full flex-col gap-3 overflow-hidden rounded-base border-2 border-border bg-blank p-3 shadow-[4px_4px_0_var(--border)] transition-all",
        isCardClickable &&
          "cursor-pointer hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-2 border-b-2 border-border bg-main" />

      <div className="flex items-start gap-3 pt-2 md:gap-4">
        <WordBadge word={word} isSaved={isSaved} variant="default" />

        <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden pt-0.5">
          {metadataContent}
        </div>

        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
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

          {!hideDetailButton && (
            <Link
              href={`/kanji/${encodeURIComponent(word)}`}
              className="flex min-h-10 shrink-0 cursor-pointer items-center justify-center rounded-base border-2 border-border bg-main p-1.5 text-main-foreground shadow-[2px_2px_0_var(--border)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none md:p-2"
              aria-label="Go to word details"
              onClick={(event) => event.stopPropagation()}
            >
              <ChevronRight size={18} />
            </Link>
          )}
        </div>
      </div>

      {shouldShowExpandedContent && expandedContent}
    </div>
  );
}
