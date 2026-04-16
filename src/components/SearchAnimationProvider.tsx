use client;

import React, { createContext, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const triggerSearchAnimation = useCallback(
    (targetUrl: string, savePromise?: Promise<any>, word?: string) => {
      // Just navigate immediately without showing overlay
      router.push(targetUrl);
      
      // Save still happens in background but doesn't block
      if (savePromise) {
        savePromise.catch(() => {
          console.error("Save failed");
        });
      }
    },
    [router],
  );

  return (
    <SearchAnimationContext.Provider value={{ triggerSearchAnimation }}>
      {children}
    </SearchAnimationContext.Provider>
  );
}