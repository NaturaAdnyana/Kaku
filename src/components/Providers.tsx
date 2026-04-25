"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { CompareWordsFloatingButton } from "@/components/CompareWordsFloatingButton";
import { CompareWordsProvider } from "@/components/CompareWordsProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CompareWordsProvider>
        {children}
        <Suspense fallback={null}>
          <CompareWordsFloatingButton />
        </Suspense>
      </CompareWordsProvider>
    </QueryClientProvider>
  );
}
