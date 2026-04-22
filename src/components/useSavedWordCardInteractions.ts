"use client";

import { useCallback, useState } from "react";
import { getJishoDefinition } from "@/app/actions/kanji";
import { useCompareWords } from "@/components/CompareWordsProvider";
import { type JishoEntry } from "@/lib/jisho";

type UseSavedWordCardInteractionsParams = {
  word: string;
  compareSourceWord?: string;
  initialEntry?: JishoEntry | null;
};

export function useSavedWordCardInteractions({
  word,
  compareSourceWord,
  initialEntry,
}: UseSavedWordCardInteractionsParams) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [entry, setEntry] = useState<JishoEntry | null>(initialEntry ?? null);
  const { isSelected, toggleWord } = useCompareWords();

  const isCompareSelected =
    compareSourceWord !== undefined && isSelected(word, compareSourceWord);

  const toggleExpanded = useCallback(async () => {
    if (entry) {
      setIsExpanded((prev) => !prev);
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
  }, [entry, word]);

  const toggleCompare = useCallback(() => {
    if (!compareSourceWord) {
      return;
    }

    toggleWord(word, compareSourceWord);
  }, [compareSourceWord, toggleWord, word]);

  return {
    entry,
    isExpanded,
    isFetching,
    isCompareSelected,
    toggleExpanded,
    toggleCompare,
  };
}
