"use client";

import React, { useState, useMemo } from "react";
import { LottiePlayer } from "@/components/LottieCanvas";
import { useLottieAnimation } from "@/hooks/useLottieAnimation";

const MESSAGES: Record<number, string[]> = {
  1: ["Your new word!", "A new discovery!", "Learning something new today?"],
  2: ["Wait, didn't you look this up?", "Again?", "Trying to memorize this?"],
  3: [
    "HOW DO YOU NOT REMEMBER THIS?!",
    "It was just a moment ago...",
    "Are you even trying?",
  ],
  4: [
    "FORGETFULNESS OVER 9000!",
    "I'M LOSING MY PATIENCE!",
    "GO BACK TO SCHOOL!",
  ],
};

interface SearchAnimationProps {
  searchCount: number;
  onComplete?: () => void;
}

export function SearchAnimation({ searchCount, onComplete }: SearchAnimationProps) {
  const level = useMemo(() => {
    if (searchCount === 1) return 1;
    if (searchCount <= 3) return 2;
    if (searchCount <= 6) return 3;
    return 4;
  }, [searchCount]);

  const [message] = useState(() => {
    const pool = MESSAGES[level] || MESSAGES[4];
    return pool[Math.floor(Math.random() * pool.length)];
  });

  const { animationData } = useLottieAnimation(`level${level}.json`);

  React.useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-black animate-in fade-in duration-300">
      <div className="w-64 h-64 mb-8">
        {animationData ? (
          <LottiePlayer animationData={animationData} loop={true} />
        ) : (
          <div className="w-full h-full flex items-center justify-center border-4 border-zinc-200 dark:border-zinc-800 rounded-full animate-pulse">
            <span className="text-zinc-400">Loading Animation...</span>
          </div>
        )}
      </div>
      <h2 className="text-2xl font-bold text-center px-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        {message}
      </h2>
      <p className="mt-2 text-zinc-500 font-medium">
        Search count: <span className="text-blue-500">{searchCount}</span>
      </p>
    </div>
  );
}
