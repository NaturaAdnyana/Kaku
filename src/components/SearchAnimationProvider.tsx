"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SearchAnimation } from "./SearchAnimation";

interface SearchAnimationContextType {
  triggerSearchAnimation: (targetUrl: string, savePromise?: Promise<any>, word?: string) => void;
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
  const [animationProps, setAnimationProps] = useState<{
    visible: boolean;
    promise?: Promise<any>;
    word?: string;
  }>({ visible: false });
  const router = useRouter();

  const triggerSearchAnimation = useCallback(
    (targetUrl: string, savePromise?: Promise<any>, word?: string) => {
      setAnimationProps({ visible: true, promise: savePromise, word });
      // Navigate immediately while animation overlay isolates the screen!
      router.push(targetUrl);
    },
    [router],
  );

  const handleComplete = useCallback(() => {
    setAnimationProps({ visible: false });
  }, []);

  return (
    <SearchAnimationContext.Provider value={{ triggerSearchAnimation }}>
      {children}
      {animationProps.visible && (
        <SearchAnimation
          savePromise={animationProps.promise}
          word={animationProps.word}
          onComplete={handleComplete}
        />
      )}
    </SearchAnimationContext.Provider>
  );
}
