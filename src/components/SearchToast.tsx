"use client";

import React, { useMemo, useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { LottiePlayer } from "@/components/LottieCanvas";
import { useLottieAnimation } from "@/hooks/useLottieAnimation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const RESULT_TOAST_DURATION = 6000;
const EXIT_ANIMATION_DURATION = 300;
const ANALYSIS_FALLBACK_MS = 3000;

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

interface SearchToastProps {
  savePromise?: Promise<unknown>;
  word?: string;
  onComplete?: () => void;
}

export function SearchToast({
  savePromise,
  word = "this",
  onComplete,
}: SearchToastProps) {
  const [searchCount, setSearchCount] = useState(1);
  const [isReadyToClose, setIsReadyToClose] = useState(!savePromise);
  const [isLeaving, setIsLeaving] = useState(false);

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
    }, ANALYSIS_FALLBACK_MS);

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
    return pool[getMessageIndex(word, level, pool.length)];
  }, [level, word]);

  const { animationData } = useLottieAnimation(`level${level}.json`);

  useEffect(() => {
    if (!isReadyToClose) return;

    const leaveTimer = setTimeout(
      () => setIsLeaving(true),
      RESULT_TOAST_DURATION - EXIT_ANIMATION_DURATION,
    );
    const completeTimer = setTimeout(() => onComplete?.(), RESULT_TOAST_DURATION);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(completeTimer);
    };
  }, [isReadyToClose, onComplete]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onComplete?.(), EXIT_ANIMATION_DURATION);
  };

  const statusContent = isReadyToClose ? (
    <>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-main">
          Search Hit #{searchCount}
        </span>
        {level === 4 && (
          <Image
            src="/animations/fire.gif"
            alt="Fire!"
            width={14}
            height={14}
            className="h-3.5 w-3.5 object-contain"
            unoptimized
          />
        )}
      </div>
      <p className="mt-0.5 line-clamp-2 text-sm font-bold leading-tight text-foreground">
        {message}
      </p>
    </>
  ) : (
    <>
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground animate-pulse">
        Analyzing...
      </span>
      <p className="mt-0.5 line-clamp-2 text-sm font-bold leading-tight text-foreground">
        Checking your search history...
      </p>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -24 }}
      animate={isLeaving ? { opacity: 0, y: -24 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed top-4 left-1/2 -translate-x-1/2 md:top-6 z-[80] w-[340px] max-w-[calc(100vw-24px)]"
    >
      <div className="relative overflow-hidden rounded-base border-2 border-border bg-blank p-3 shadow-[4px_4px_0_var(--border)]">
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-base border-2 border-border bg-secondary">
            {animationData ? (
              <div className="scale-[1.5]">
                <LottiePlayer animationData={animationData} loop={true} />
              </div>
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            )}
          </div>

          <div className="min-w-0 flex-1 pr-4">{statusContent}</div>
        </div>

        <button
          onClick={handleClose}
          className="absolute right-2 top-2 cursor-pointer text-muted-foreground transition-transform hover:scale-110 hover:text-foreground"
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

        <div className="absolute bottom-0 left-0 h-1.5 w-full overflow-hidden border-t border-border/30 bg-secondary/70">
          <div
            className={cn(
              "h-full w-full origin-left bg-main",
              isReadyToClose ? "animate-toast-progress" : "opacity-60",
              isLeaving && "opacity-0 transition-opacity",
            )}
            style={{
              animationDuration: `${RESULT_TOAST_DURATION}ms`,
              animationTimingFunction: "linear",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
