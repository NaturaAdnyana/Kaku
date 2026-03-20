"use client";

import React, { useState, useMemo } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { useSvgAnimations } from "@/hooks/useSvgAnimations";

interface KanjiDetailCarouselProps {
  word: string;
  bannerContent: React.ReactNode;
}

/** Inner component — needs to be a child of <Carousel> to use useCarousel() */
function KanjiDetailCarouselContent({
  word,
  bannerContent,
}: KanjiDetailCarouselProps) {
  const { api } = useCarousel();
  const [current, setCurrent] = useState(0);

  // Sync active dot with carousel — cleans up listener on unmount
  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());

    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const { animations, loading } = useSvgAnimations(word);

  // Memoized slides — only rebuilds when animations or bannerContent change
  const slides = useMemo(() => {
    const base = [{ type: "banner" as const, content: bannerContent }];

    const animSlides = animations.map((anim) => ({
      type: "animation" as const,
      content: (
        <div className="flex flex-col items-center justify-center py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm text-center relative overflow-hidden w-full">
          <div
            className="w-full max-w-24 aspect-square flex items-center justify-center dark:invert dark:hue-rotate-180"
            dangerouslySetInnerHTML={{ __html: anim.svgContent }}
          />
          <span className="mt-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Stroke Order: {anim.char}
          </span>
        </div>
      ),
    }));

    if (loading && animations.length === 0) {
      return [
        ...base,
        {
          type: "loading" as const,
          content: (
            <div className="flex flex-col items-center justify-center py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm text-center relative overflow-hidden w-full animate-pulse">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-3" />
              <span className="text-zinc-400 text-xs">Loading animations...</span>
            </div>
          ),
        },
      ];
    }

    return [...base, ...animSlides];
  }, [animations, bannerContent, loading]);

  const showNav = slides.length > 1;

  return (
    <>
      <CarouselContent className="h-full">
        {slides.map((slide, index) => (
          <CarouselItem
            key={index}
            className="flex h-full items-center justify-center"
          >
            <div className="w-full">{slide.content}</div>
          </CarouselItem>
        ))}
      </CarouselContent>

      {showNav && (
        <>
          <CarouselPrevious className="-left-2 transition-opacity bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-zinc-200 dark:border-zinc-800 active:-translate-y-1/2" />
          <CarouselNext className="-right-2 transition-opacity bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-zinc-200 dark:border-zinc-800 active:-translate-y-1/2" />
        </>
      )}

      {/* Active dot indicators */}
      {showNav && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => api?.scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "rounded-full transition-all duration-200",
                current === i
                  ? "w-3 h-1.5 bg-zinc-500 dark:bg-zinc-400"
                  : "w-1.5 h-1.5 bg-zinc-300/70 dark:bg-zinc-700/70 hover:bg-zinc-400 dark:hover:bg-zinc-600",
              )}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function KanjiDetailCarousel({
  word,
  bannerContent,
}: KanjiDetailCarouselProps) {
  return (
    <div className="w-full relative group">
      <Carousel className="w-full relative h-40 md:h-44 **:data-[slot=carousel-content]:h-full">
        <KanjiDetailCarouselContent word={word} bannerContent={bannerContent} />
      </Carousel>
    </div>
  );
}
