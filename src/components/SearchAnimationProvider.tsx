"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SearchAnimation } from "./SearchAnimation";

interface SearchAnimationContextType {
  triggerSearchAnimation: (searchCount: number, targetUrl: string) => void;
}

const SearchAnimationContext = createContext<
  SearchAnimationContextType | undefined
>(undefined);

export function useSearchAnimation() {
  const context = useContext(SearchAnimationContext);
  if (!context) {
    throw new Error(
      "useSearchAnimation must be used within a SearchAnimationProvider",
    );
  }
  return context;
}

export function SearchAnimationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  const router = useRouter();

  const triggerSearchAnimation = useCallback(
    (count: number, targetUrl: string) => {
      setSearchCount(count);
      setIsVisible(true);
      // Navigate immediately while animation is showing
      router.push(targetUrl);
    },
    [router],
  );

  const handleComplete = useCallback(() => {
    setIsVisible(false);
  }, []);

  return (
    <SearchAnimationContext.Provider value={{ triggerSearchAnimation }}>
      {children}
      {isVisible && (
        <SearchAnimation
          searchCount={searchCount}
          onComplete={handleComplete}
        />
      )}
    </SearchAnimationContext.Provider>
  );
}
