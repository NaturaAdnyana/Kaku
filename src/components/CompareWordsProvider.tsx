"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

type CompareWordsContextValue = {
  sourceWord: string | null;
  selectedWords: string[];
  isSelected: (word: string, sourceWord: string) => boolean;
  toggleWord: (word: string, sourceWord: string) => void;
  clearCompare: () => void;
};

const MAX_COMPARE_WORDS = 4;

const CompareWordsContext = createContext<CompareWordsContextValue | undefined>(
  undefined,
);

export function CompareWordsProvider({ children }: { children: ReactNode }) {
  const [sourceWord, setSourceWord] = useState<string | null>(null);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);

  const clearCompare = useCallback(() => {
    setSourceWord(null);
    setSelectedWords([]);
  }, []);

  const toggleWord = useCallback(
    (word: string, nextSourceWord: string) => {
      const baseWords =
        sourceWord === nextSourceWord ? selectedWords : [];
      const isAlreadySelected = baseWords.includes(word);

      if (isAlreadySelected) {
        const remainingWords = baseWords.filter(
          (currentWord) => currentWord !== word,
        );
        setSelectedWords(remainingWords);
        setSourceWord(remainingWords.length > 0 ? nextSourceWord : null);
        return;
      }

      if (baseWords.length >= MAX_COMPARE_WORDS) {
        toast.error(`You can compare up to ${MAX_COMPARE_WORDS} words at once.`);
        return;
      }

      setSelectedWords([...baseWords, word]);
      setSourceWord(nextSourceWord);
    },
    [selectedWords, sourceWord],
  );

  const value = useMemo<CompareWordsContextValue>(
    () => ({
      sourceWord,
      selectedWords,
      isSelected: (word: string, currentSourceWord: string) =>
        sourceWord === currentSourceWord && selectedWords.includes(word),
      toggleWord,
      clearCompare,
    }),
    [clearCompare, selectedWords, sourceWord, toggleWord],
  );

  return (
    <CompareWordsContext.Provider value={value}>
      {children}
    </CompareWordsContext.Provider>
  );
}

export function useCompareWords() {
  const context = useContext(CompareWordsContext);
  if (!context) {
    throw new Error("useCompareWords must be used within CompareWordsProvider");
  }

  return context;
}
