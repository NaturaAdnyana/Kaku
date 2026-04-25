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

export type CompareWordsContextMode = "detail" | "list";

export type CompareWordsScope = {
  key: string;
  pagePath: string;
  routeWord: string;
  context?: CompareWordsContextMode;
};

type CompareWordsContextValue = {
  compareScope: CompareWordsScope | null;
  selectedWords: string[];
  isSelected: (word: string, scopeKey: string) => boolean;
  toggleWord: (word: string, scope: CompareWordsScope) => void;
  clearCompare: () => void;
};

const MAX_COMPARE_WORDS = 4;

const CompareWordsContext = createContext<CompareWordsContextValue | undefined>(
  undefined,
);

type CompareWordsState = {
  compareScope: CompareWordsScope | null;
  selectedWords: string[];
};

export function CompareWordsProvider({ children }: { children: ReactNode }) {
  const [compareState, setCompareState] = useState<CompareWordsState>({
    compareScope: null,
    selectedWords: [],
  });

  const clearCompare = useCallback(() => {
    setCompareState({
      compareScope: null,
      selectedWords: [],
    });
  }, []);

  const toggleWord = useCallback(
    (word: string, nextScope: CompareWordsScope) => {
      setCompareState((current) => {
        const isSameScope = current.compareScope?.key === nextScope.key;
        const baseWords = isSameScope ? current.selectedWords : [];
        const isAlreadySelected = baseWords.includes(word);

        if (isAlreadySelected) {
          const remainingWords = baseWords.filter(
            (currentWord) => currentWord !== word,
          );

          return {
            compareScope:
              remainingWords.length > 0 ? current.compareScope : null,
            selectedWords: remainingWords,
          };
        }

        if (baseWords.length >= MAX_COMPARE_WORDS) {
          toast.error(
            `You can compare up to ${MAX_COMPARE_WORDS} words at once.`,
          );
          return current;
        }

        return {
          compareScope: isSameScope ? current.compareScope : nextScope,
          selectedWords: [...baseWords, word],
        };
      });
    },
    [],
  );

  const value = useMemo<CompareWordsContextValue>(
    () => ({
      compareScope: compareState.compareScope,
      selectedWords: compareState.selectedWords,
      isSelected: (word: string, scopeKey: string) =>
        compareState.compareScope?.key === scopeKey &&
        compareState.selectedWords.includes(word),
      toggleWord,
      clearCompare,
    }),
    [clearCompare, compareState, toggleWord],
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
