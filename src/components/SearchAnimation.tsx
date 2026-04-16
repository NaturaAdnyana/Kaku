"use client";

import React, { useMemo, useEffect, useState } from "react";
import { LottiePlayer } from "@/components/LottieCanvas";
import { useLottieAnimation } from "@/hooks/useLottieAnimation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const getMessages = (word: string): Record<number, string[]> => ({
  1: [
    `Ready to learn ${word}?`,
    `A new discovery: ${word}!`,
    `Conquering ${word} today!`,
  ],
  2: [
    `Wait, didn't you look up ${word}?`,
    `${word} again?`,
    `Memorizing ${word}?`,
  ],
  3: [
    `HOW DO YOU NOT REMEMBER ${word}?!`,
    `You just saw ${word} a moment ago...`,
    `Are you even trying with ${word}?`,
  ],
  4: [
    "FORGETFULNESS OVER 9000!",
    `I'M LOSING MY PATIENCE WITH ${word}!`,
    `WRITE ${word} 100 TIMES NOW!`,
  ],
});

const getMessageIndex = (word: string, level: number, poolLength: number) => {
  if (poolLength <= 1) return 0;

  const seed = `${word}-${level}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 2147483647;
  }

  return Math.abs(hash) % poolLength;
};

interface SearchAnimationProps {
  savePromise?: Promise<unknown>;
  word?: string;
  onComplete?: () => void;
}

export function SearchAnimation({
  savePromise,
  word = "this",
  onComplete,
}: SearchAnimationProps) {
  const [searchCount, setSearchCount] = useState(1);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isReadyToClose, setIsReadyToClose] = useState(!savePromise);

  useEffect(() => {
    let mounted = true;

    if (!savePromise) {
      return () => {
        mounted = false;
      };
    }

    const fallbackTimer = setTimeout(() => {
      if (mounted) {
        setIsReadyToClose(true);
      }
    }, 3000);

    savePromise
      .then((res) => {
        if (!mounted) return;

        const response = res as { searchCount?: number } | undefined;
        if (typeof response?.searchCount === "number") {
          setSearchCount(Math.max(1, response.searchCount));
        }

        setIsReadyToClose(true);
      })
      .catch(() => {
        if (mounted) {
          setIsReadyToClose(true);
        }
      })
      .finally(() => {
        clearTimeout(fallbackTimer);
      });

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
    };
  }, [savePromise]);

  const level = useMemo(() => {
    if (searchCount === 1) return 1;
    if (searchCount <= 3) return 2;
    if (searchCount <= 6) return 3;
    return 4;
  }, [searchCount]);

  const message = useMemo(() => {
    const pool = getMessages(word)[level] || getMessages(word)[4];
    const index = getMessageIndex(word, level, pool.length);
    return pool[index];
  }, [level, word]);

  const { animationData } = useLottieAnimation(`level${level}.json`);

  useEffect(() => {
    if (!isReadyToClose) return;

    const totalTime = 6000;
    const leaveTimer = setTimeout(() => setIsLeaving(true), totalTime - 300);
    const completeTimer = setTimeout(() => onComplete?.(), totalTime);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(completeTimer);
    };
  }, [isReadyToClose, onComplete]);

  return (
    <div
      className={cn(
        "fixed top-20 right-4 md:top-8 md:right-8 z-[80] flex items-center gap-3 bg-blank border-2 border-border shadow-[4px_4px_0_var(--border)] rounded-base p-3 w-[320px] max-w-[calc(100vw-32px)] duration-300",
        isLeaving
          ? "animate-out slide-out-to-right-12 fade-out"
          : "animate-in slide-in-from-right-8 slide-in-from-top-4 fade-in",
      )}
    >
      <div className="w-14 h-14 shrink-0 bg-secondary border-2 border-border rounded-base overflow-hidden flex items-center justify-center relative">
        {animationData ? (
          <div className="scale-[1.5]">
            <LottiePlayer animationData={animationData} loop={true} />
          </div>
        ) : (
          <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
        )}
      </div>

      <div className="flex flex-col flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-main">
            Search Hit #{searchCount}
          </span>
          {level === 4 && (
            <img
              src="/animations/fire.gif"
              alt="Fire!"
              className="w-3.5 h-3.5 object-contain"
            />
          )}
        </div>

        <p className="text-sm font-bold text-foreground leading-tight mt-0.5 line-clamp-2">
          {message}
        </p>

        {!isReadyToClose && (
          <span className="text-[10px] font-medium text-muted-foreground mt-1 animate-pulse">
            Analyzing...
          </span>
        )}
      </div>

      <button
        onClick={() => {
          setIsLeaving(true);
          setTimeout(() => onComplete?.(), 300);
        }}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground hover:scale-110 transition-transform cursor-pointer"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>

      <div
        className={cn(
          "absolute bottom-0 left-0 h-1 bg-main flex origin-left",
          isReadyToClose ? "animate-toast-progress" : "opacity-40",
          isLeaving && "opacity-0 transition-opacity",
        )}
        style={{
          width: "100%",
          animationDuration: "6s",
          animationTimingFunction: "linear",
        }}
      />
    </div>
  );
}
