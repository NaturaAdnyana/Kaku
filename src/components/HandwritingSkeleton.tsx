"use client";

import React from "react";

export function HandwritingSkeleton() {
  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto space-y-4 animate-pulse">
      {/* Composed Word Input Area Skeleton */}
      <div className="flex w-full space-x-2">
        <div className="flex-1 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg shadow-sm" />
        <div className="w-16 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg shadow-md" />
      </div>

      {/* Canvas Area Skeleton */}
      <div className="relative w-full aspect-square bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-inner overflow-hidden" />

      {/* Candidates Area Skeleton */}
      <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 min-h-30 shadow-sm flex flex-col gap-4">
        <div className="w-32 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="flex flex-wrap gap-2 mt-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
