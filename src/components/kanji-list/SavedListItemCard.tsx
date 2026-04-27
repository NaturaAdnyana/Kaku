"use client";

import { useState } from "react";

import {
  getKanjiApiDetails,
  type KanjiApiDetails,
} from "@/app/actions/kanji";
import { WordDetailCard } from "@/components/WordDetailCard";
import { DeleteListItemButton } from "@/components/kanji-list/DeleteListItemButton";
import {
  KanjiPeekButton,
  KanjiPeekContent,
} from "@/components/kanji-list/KanjiPeek";
import { SavedListItemMeta } from "@/components/kanji-list/SavedListItemMeta";
import type { ListType, SavedListItem } from "@/components/kanji-list/types";
import { formatLocalIsoDate } from "@/components/kanji-list/utils";

export function SavedListItemCard({
  item,
  type,
  itemRef,
  onOpen,
  onDelete,
}: {
  item: SavedListItem;
  type: ListType;
  itemRef?: ((node?: Element | null) => void) | null;
  onOpen: (character: string) => void;
  onDelete: (event: React.MouseEvent, character: string) => void;
}) {
  const isWordList = type === "word";
  const [isPeekExpanded, setIsPeekExpanded] = useState(false);
  const [isPeekFetching, setIsPeekFetching] = useState(false);
  const [peekData, setPeekData] = useState<KanjiApiDetails | null>(null);

  const handlePeek = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (isPeekExpanded) {
      setIsPeekExpanded(false);
      return;
    }

    setIsPeekExpanded(true);
    if (peekData) return;

    setIsPeekFetching(true);
    try {
      const result = await getKanjiApiDetails(item.character);
      if (result.success && result.data) {
        setPeekData(result.data);
      }
    } finally {
      setIsPeekFetching(false);
    }
  };

  return (
    <div ref={itemRef}>
      <WordDetailCard
        word={item.character}
        isSaved
        searchCount={item.searchCount}
        savedDate={formatLocalIsoDate(item.updatedAt)}
        compareSourceWord={isWordList ? item.character : undefined}
        compareScopeKey={isWordList ? "saved-word-list" : undefined}
        comparePagePath={isWordList ? "/list" : undefined}
        compareContext={isWordList ? "list" : undefined}
        metaSlot={<SavedListItemMeta item={item} type={type} />}
        title={`Last updated ${formatLocalIsoDate(item.updatedAt)}`}
        onCardClick={() => onOpen(item.character)}
        hideDetailButton
        showRevealButton={isWordList}
        expandedSlot={
          !isWordList ? (
            <KanjiPeekContent data={peekData} isFetching={isPeekFetching} />
          ) : undefined
        }
        showExpandedSlot={!isWordList && isPeekExpanded}
        layout="saved-list"
        leadingActionSlot={
          !isWordList ? (
            <KanjiPeekButton
              isExpanded={isPeekExpanded}
              isFetching={isPeekFetching}
              onClick={handlePeek}
            />
          ) : undefined
        }
        actionSlot={
          <DeleteListItemButton character={item.character} onDelete={onDelete} />
        }
      />
    </div>
  );
}
