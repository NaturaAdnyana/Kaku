"use client";

import React, { createContext, Suspense, useContext, useTransition, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";

// Context to let tab content areas know a navigation is in-flight
export const URLTabsPendingContext = createContext(false);
export const useURLTabsPending = () => useContext(URLTabsPendingContext);

interface URLTabsProps extends React.ComponentProps<typeof Tabs> {
  paramName?: string;
  defaultValue: string;
}

function URLTabsInner({
  paramName = "tab",
  defaultValue,
  children,
  ...props
}: URLTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Optimistic: reflect the click immediately in the UI
  const urlTab = searchParams.get(paramName) || defaultValue;
  const [optimisticTab, setOptimisticTab] = useState(urlTab);

  // Keep optimistic in sync when URL changes (back/forward navigation)
  const resolvedTab = isPending ? optimisticTab : urlTab;

  const handleTabChange = (value: string) => {
    // Immediately update the tab header with no wait
    setOptimisticTab(value);

    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, value);

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <URLTabsPendingContext.Provider value={isPending}>
      <Tabs value={resolvedTab} onValueChange={handleTabChange} {...props}>
        {children}
      </Tabs>
    </URLTabsPendingContext.Provider>
  );
}

export function URLTabs(props: URLTabsProps) {
  const { defaultValue, ...restProps } = props;

  return (
    <Suspense fallback={<Tabs defaultValue={defaultValue} {...restProps} />}>
      <URLTabsInner {...props} />
    </Suspense>
  );
}
