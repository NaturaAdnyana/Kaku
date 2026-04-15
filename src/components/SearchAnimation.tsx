"use client";

import React, { useState, useMemo, useEffect } from "react";
import { LottiePlayer } from "@/components/LottieCanvas";
import { useLottieAnimation } from "@/hooks/useLottieAnimation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const getMessages = (word: string): Record<number, string[]> => ({
  1: [`Ready to learn ${word}?`, `A new discovery: ${word}!`, `Conquering ${word} today!`],
  2: [`Wait, didn't you look up ${word}?`, `${word} again?`, `Memorizing ${word}?`],
  3: [
    `HOW DO YOU NOT REMEMBER ${word}?!`,
    `You just saw ${word} a moment ago...`,
    `Are you even trying with ${word}?`,
  ],
  4: [
    `FORGETFULNESS OVER 9000!`,
    `I'M LOSING MY PATIENCE WITH ${word}!`,
    `WRITE ${word} 100 TIMES NOW!`,
  ],
});

interface SearchAnimationProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  savePromise?: Promise<any>;
  word?: string;
  onComplete?: () => void;
}

export function SearchAnimation({ savePromise, word = "this", onComplete }: SearchAnimationProps) {
  const [searchCount, setSearchCount] = useState<number | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (savePromise) {
      savePromise.then((res) => {
        if (mounted) {
          setSearchCount(res?.searchCount || 1);
        }
      }).catch(() => {
        if (mounted) setSearchCount(1);
      });
    } else {
      setSearchCount(1);
    }
    return () => {
      mounted = false;
    };
  }, [savePromise]);

  const level = useMemo(() => {
    if (searchCount === null) return null;
    if (searchCount === 1) return 1;
    if (searchCount <= 3) return 2;
    if (searchCount <= 6) return 3;
    return 4;
  }, [searchCount]);

  const [message, setMessage] = useState<string>("Analyzing...");

  useEffect(() => {
    if (level !== null) {
      const pool = getMessages(word)[level] || getMessages(word)[4];
      setMessage(pool[Math.floor(Math.random() * pool.length)]);
    }
  }, [level, word]);

  const { animationData } = useLottieAnimation(level ? `level${level}.json` : "");

  useEffect(() => {
    const totalTime = 6000; // Keep toast up for 6s total
    const leaveTimer = setTimeout(() => setIsLeaving(true), totalTime - 300); // Trigger exit animation 300ms before unmount
    const completeTimer = setTimeout(() => onComplete?.(), totalTime);
    
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={cn(
      "fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 flex items-center gap-3 bg-blank border-2 border-border shadow-[4px_4px_0_var(--border)] rounded-base p-3 w-[320px] max-w-[calc(100vw-32px)] duration-300",
      isLeaving ? "animate-out slide-out-to-right-12 fade-out" : "animate-in slide-in-from-right-8 slide-in-from-bottom-4 fade-in"
    )}>
      <div className="w-14 h-14 shrink-0 bg-secondary border-2 border-border rounded-base overflow-hidden flex items-center justify-center relative">
        {(level !== null && animationData) ? (
          <div className="scale-[1.5]">
            <LottiePlayer animationData={animationData} loop={true} />
          </div>
        ) : (
          <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
        )}
      </div>

      <div className="flex flex-col flex-1 min-w-0 pr-4">
        {searchCount !== null ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-main">
              Search Hit #{searchCount}
            </span>
            {level === 4 && <img src="/animations/fire.gif" alt="Fire!" className="w-3.5 h-3.5 object-contain" />}
          </div>
        ) : (
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground animate-pulse">
            Checking Library...
          </span>
        )}
        <p className="text-sm font-bold text-foreground leading-tight mt-0.5 line-clamp-2">
          {message}
        </p>
      </div>

      <button
        onClick={() => {
          setIsLeaving(true);
          setTimeout(() => onComplete?.(), 300);
        }}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground hover:scale-110 transition-transform cursor-pointer"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>

      {/* Progress Bar under toast */}
      <div className={cn(
        "absolute bottom-0 left-0 h-1 bg-main flex origin-left animate-toast-progress",
        isLeaving && "opacity-0 transition-opacity"
      )} style={{ width: '100%', animationDuration: '6s', animationTimingFunction: 'linear' }} />
    </div>
  );
}
