"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from "@/components/ui/carousel";
import { cn, getSearchCountColor, isKanji } from "@/lib/utils";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getKanjiByWord } from "@/app/actions/kanji";
import { useSvgAnimations } from "@/hooks/useSvgAnimations";

interface KanjiCarouselProps {
  decodedWord: string;
  apiEntry: any;
}

function KanjiSVG({ svgContent }: { svgContent: string }) {
  const [replayKey, setReplayKey] = React.useState(0);

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setReplayKey((prev) => prev + 1);
  };

  return (
    <div className="relative group/svg">
      <div
        key={replayKey}
        className="w-28 h-28 mb-4 dark:invert dark:hue-rotate-180 flex items-center justify-center transition-opacity duration-300"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      <button
        onClick={handleReplay}
        className="absolute top-1/2 -translate-y-1/2 -right-10 p-2 bg-zinc-100 hover:bg-orange-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 active:text-orange-600 dark:text-zinc-400 dark:active:text-orange-400 rounded-full shadow-sm border border-zinc-200/50 dark:border-zinc-700/50 transition-transform active:scale-95 z-10"
        title="Replay Animation"
      >
        <RotateCw size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function KanjiCarouselContent({ decodedWord, apiEntry }: KanjiCarouselProps) {
  const { api } = useCarousel();
  const [current, setCurrent] = useState(0);

  // Track active slide — properly cleaned up on unmount / api change
  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());

    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const { data: dbData } = useQuery({
    queryKey: ["kanji-dbData", decodedWord],
    queryFn: async () => await getKanjiByWord(decodedWord),
  });

  // Shared hook — no more inline fetch logic
  const { animations } = useSvgAnimations(decodedWord);

  // Stable total so it doesn't recompute on every render
  const totalSlides = useMemo(() => animations.length + 1, [animations]);

  // Stable scroll handler
  const scrollTo = useCallback((index: number) => api?.scrollTo(index), [api]);

  // Scale font + tile padding down gracefully for longer words
  const charCount = decodedWord.length;
  const fontSize =
    charCount <= 1
      ? "text-7xl"
      : charCount <= 2
        ? "text-7xl"
        : charCount <= 3
          ? "text-6xl"
          : charCount <= 4
            ? "text-5xl"
            : "text-4xl";
  const tilePadding =
    charCount <= 2
      ? "p-2 pr-4 pt-3"
      : charCount <= 3
        ? "p-1.5 pr-3 pt-2"
        : charCount <= 5
          ? "p-1 pr-2 pt-1.5"
          : "p-1 pr-1.5 pt-1";
  const containerPadding =
    charCount <= 3 ? "p-10" : charCount <= 5 ? "p-6" : "p-4";

  return (
    <>
      <CarouselContent>
        <CarouselItem className="flex flex-col items-center justify-center h-50">
          <div
            className={cn(
              "flex flex-col items-center justify-center h-full w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm text-center relative overflow-hidden box-border transition-all duration-300",
              containerPadding,
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center mb-4 font-medium tracking-tighter flex-wrap gap-y-1",
                fontSize,
              )}
            >
              {decodedWord.length > 1 ? (
                decodedWord.split("").map((char, i) => {
                  if (isKanji(char)) {
                    return (
                      <Link
                        // composite key — stable even if word changes
                        key={`${char}-${i}`}
                        href={`/kanji/${encodeURIComponent(char)}`}
                        className={cn(
                          "bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-zinc-700/50 rounded-lg aspect-square mx-0.5 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-200 dark:hover:border-orange-800/50 hover:text-orange-600 dark:hover:text-orange-400 hover:-translate-y-1 active:translate-y-0 shadow-sm hover:shadow-md transition-all cursor-pointer inline-flex items-center justify-center",
                          tilePadding,
                        )}
                        title={`Inspect ${char}`}
                      >
                        {char}
                      </Link>
                    );
                  }
                  return (
                    <span
                      key={`${char}-${i}`}
                      className="inline-block mx-1 leading-snug"
                    >
                      {char}
                    </span>
                  );
                })
              ) : (
                <span className="inline-block">{decodedWord}</span>
              )}
            </div>

            {/* Reading Kana */}
            {apiEntry?.japanese?.[0]?.reading && (
              <span className="text-xl text-zinc-700 dark:text-zinc-300 font-medium">
                {apiEntry.japanese[0].reading}
              </span>
            )}

            {/* Local Stats Badge */}
            {dbData?.kanji && dbData.kanji.searchCount > 1 && (
              <div
                className={cn(
                  "absolute bottom-4 right-4 text-xs px-3 py-1 rounded-full flex justify-center gap-1 items-center",
                  getSearchCountColor(dbData.kanji.searchCount),
                )}
              >
                <span className="text-[10px] opacity-70 uppercase tracking-widest">
                  Searched
                </span>
                <span className="text-sm font-bold">
                  {dbData.kanji.searchCount}x
                </span>
              </div>
            )}
          </div>
        </CarouselItem>
        {animations.map(({ char, svgContent }) => (
          <CarouselItem
            key={char}
            className="flex flex-col items-center justify-center h-50"
          >
            <div className="flex flex-col items-center justify-center h-full w-full p-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm text-center relative overflow-hidden box-border group transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700">
              <KanjiSVG svgContent={svgContent} />
              {decodedWord.length > 1 && (
                <div className="text-center">
                  <span className="text-md text-zinc-600 dark:text-zinc-400 font-medium">
                    {char}{" "}
                  </span>
                  <span className="text-md text-zinc-600 dark:text-zinc-400 tracking-wide">
                    from {decodedWord}
                  </span>
                </div>
              )}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className="left-5" />
      <CarouselNext className="right-5" />
      {/* Dot Indicators */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-1 h-1 rounded-full transition-all duration-200",
              current === index
                ? "bg-zinc-700 dark:bg-zinc-300 scale-125"
                : "bg-zinc-300 dark:bg-zinc-600 opacity-50 hover:opacity-75",
            )}
            onClick={() => scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </>
  );
}

export default function KanjiCarousel({
  decodedWord,
  apiEntry,
}: KanjiCarouselProps) {
  return (
    <Carousel className="w-full h-full overflow-hidden py-5 relative">
      <KanjiCarouselContent decodedWord={decodedWord} apiEntry={apiEntry} />
    </Carousel>
  );
}
