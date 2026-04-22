"use client";

import { useState } from "react";

import { getJishoDefinition } from "@/app/actions/kanji";
import { useCompareWords } from "@/components/CompareWordsProvider";
import {
  getPrimaryJishoDefinition,
  getPrimaryJishoReading,
  type JishoEntry,
} from "@/lib/jisho";

type UseWordCardBehaviorParams = {
  word: string;
  initialEntry?: JishoEntry | null;
  compareSourceWord?: string;
  allowReveal?: boolean;
};

export function useWordCardBehavior({
  word,
  initialEntry,
  compareSourceWord,
  allowReveal = false,
}: UseWordCardBehaviorParams) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [entry, setEntry] = useState<JishoEntry | null>(initialEntry ?? null);
  const { isSelected, toggleWord } = useCompareWords();

  const reading = getPrimaryJishoReading(entry);
  const definition = getPrimaryJishoDefinition(entry);
  const isCompareSelected =
    compareSourceWord !== undefined && isSelected(word, compareSourceWord);

  const toggleReveal = async () => {
    if (!allowReveal) {
      return;
    }

    if (entry) {
      setIsExpanded((current) => !current);
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

  const toggleCompare = () => {
    if (!compareSourceWord) {
      return;
    }

    toggleWord(word, compareSourceWord);
  };

  return {
    definition,
    entry,
    isCompareSelected,
    isExpanded,
    isFetching,
    reading,
    toggleCompare,
    toggleReveal,
  };
}
