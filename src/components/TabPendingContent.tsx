"use client";

import React from "react";
import { useURLTabsPending } from "@/components/URLTabs";
import { KanjiSkeleton } from "@/components/KanjiList";

/**
 * Wraps tab content — shows a skeleton immediately when a URL tab
 * transition is in-flight, so the user gets instant visual feedback.
 */
export function TabPendingContent({
  children,
  skeleton,
}: {
  children: React.ReactNode;
  skeleton?: React.ReactNode;
}) {
  const isPending = useURLTabsPending();
  if (isPending) {
    return <>{skeleton ?? <KanjiSkeleton />}</>;
  }
  return <>{children}</>;
}
