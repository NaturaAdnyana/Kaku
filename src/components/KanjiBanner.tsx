"use client";

import React, { useState } from "react";
import { cn, isKanji } from "@/lib/utils";
import Link from "next/link";
import { RotateCw, MessageCircle, PenLine, Repeat } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getKanjiByWord } from "@/app/actions/kanji";
import { useSvgAnimations } from "@/hooks/useSvgAnimations";
import { motion } from "framer-motion";

interface KanjiBannerProps {
  decodedWord: string;
  apiEntry: {
    japanese?: Array<{
      reading?: string;
    }>;
  } | null;
}

function KanjiSVG({ svgContent }: { svgContent: string }) {
  const [replayKey, setReplayKey] = React.useState(0);

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setReplayKey((prev) => prev + 1);
  };

  return (
    <div className="relative group/svg flex flex-col items-center">
      <div
        key={replayKey}
        className="w-28 h-28 mb-4 dark:invert dark:hue-rotate-180 flex items-center justify-center transition-opacity duration-300"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      <button
        onClick={handleReplay}
        className="absolute top-1/2 -translate-y-1/2 -right-12 p-2 bg-blank text-foreground shadow-[2px_2px_0_var(--border)] border-2 border-border transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:bg-main active:text-main-foreground font-bold rounded-base z-10"
        title="Replay Animation"
      >
        <RotateCw size={14} strokeWidth={3} />
      </button>
    </div>
  );
}

export function KanjiBanner({ decodedWord, apiEntry }: KanjiBannerProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const wordChars = Array.from(decodedWord);
  const isSingleKanji = wordChars.length === 1 && isKanji(wordChars[0]);

  // DB Data
  const { data: dbData } = useQuery({
    queryKey: ["kanji-dbData", decodedWord],
    queryFn: () => getKanjiByWord(decodedWord),
    enabled: decodedWord.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  // SVG Data
  const { animations } = useSvgAnimations(decodedWord);
  const svgContent = animations[0]?.svgContent;

  const charCount = wordChars.length;
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

  // --- Multi Kanji (Word) Box ---
  if (!isSingleKanji) {
    return (
      <div className={cn("flex flex-col items-center justify-center w-full min-h-[220px] bg-blank border-2 border-border rounded-base shadow-shadow text-center relative overflow-hidden box-border mb-6", containerPadding)}>
        <div className={cn("flex items-center justify-center mb-4 font-medium tracking-tighter flex-wrap gap-y-1", fontSize)}>
           {wordChars.map((char, i) => {
              if (isKanji(char)) {
                return (
                  <Link
                    key={`${char}-${i}`}
                    href={`/kanji/${encodeURIComponent(char)}`}
                    className={cn(
                      "bg-secondary border-2 border-border text-foreground rounded-base mx-0.5 shadow-[2px_2px_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer inline-flex items-center justify-center font-bold",
                      tilePadding,
                    )}
                    title={`Inspect ${char}`}
                  >
                    {char}
                  </Link>
                );
              }
              return (
                <span key={`${char}-${i}`} className="inline-block mx-1 leading-snug">
                  {char}
                </span>
              );
            })}
        </div>

        {apiEntry?.japanese?.[0]?.reading && (
          <span className="text-xl text-foreground font-bold mt-2">
            {apiEntry.japanese[0].reading}
          </span>
        )}

        <Link
          href={`/kanji/${encodeURIComponent(decodedWord)}/chat`}
          className="absolute bottom-4 left-4 px-3 py-1.5 bg-main text-main-foreground shadow-[2px_2px_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] border-2 border-border rounded-base transition-transform z-10 flex items-center gap-1.5"
        >
          <MessageCircle size={14} strokeWidth={3} />
          <span className="text-xs font-bold">Ask Koijo</span>
        </Link>
        
        {dbData?.kanji && dbData.kanji.searchCount > 1 && (
          <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-base bg-secondary text-foreground shadow-[2px_2px_0_var(--border)] border-2 border-border flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest">
              Searched
            </span>
            <span className="text-xs font-black">
              {dbData.kanji.searchCount}x
            </span>
          </div>
        )}
      </div>
    );
  }

  // --- Single Kanji Flipcard ---
  return (
    <div 
      className="w-full relative h-[250px] mb-6 [perspective:2000px] cursor-pointer group"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative [transform-style:preserve-3d]"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
      >
        {/* FRONT FACE */}
        <div className={cn("absolute inset-0 flex flex-col items-center justify-center bg-blank border-2 border-border rounded-base shadow-[6px_6px_0_var(--border)] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[8px_8px_0_var(--border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_var(--border)] transition-all text-center box-border p-6", "[backface-visibility:hidden]")}>
           <div className={cn("flex items-center justify-center font-medium tracking-tighter mb-2", fontSize)}>
              {decodedWord}
           </div>

           {apiEntry?.japanese?.[0]?.reading && (
              <span className="text-xl text-foreground font-bold mt-2">
                {apiEntry.japanese[0].reading}
              </span>
           )}

           <div className="absolute top-4 right-4 flex items-center gap-1.5 text-muted-foreground">
             <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:inline">Flip for strokes</span>
             <Repeat size={14} className="group-hover:rotate-180 transition-transform duration-500" />
           </div>

           <Link
              href={`/kanji/${encodeURIComponent(decodedWord)}/chat`}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-4 left-4 px-3 py-1.5 bg-main text-main-foreground shadow-[2px_2px_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] border-2 border-border rounded-base transition-all z-10 flex items-center gap-1.5"
            >
              <MessageCircle size={14} strokeWidth={3} />
              <span className="text-xs font-bold">Ask Koijo</span>
           </Link>

           {dbData?.kanji && dbData.kanji.searchCount > 1 && (
            <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-base bg-secondary text-foreground shadow-[2px_2px_0_var(--border)] border-2 border-border flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-widest">
                Searched
              </span>
              <span className="text-xs font-black">
                {dbData.kanji.searchCount}x
              </span>
            </div>
          )}
        </div>

        {/* BACK FACE */}
        <div className={cn("absolute inset-0 flex flex-col items-center justify-center w-full h-full bg-blank border-2 border-border rounded-base shadow-shadow text-center box-border p-6", "[backface-visibility:hidden] [transform:rotateY(180deg)]")}>
          {svgContent ? (
             <div className="scale-110 mb-2">
               <KanjiSVG svgContent={svgContent} />
             </div>
          ) : (
            <div className="text-muted-foreground font-bold animate-pulse">Loading Strokes...</div>
          )}

           <Link
              href={`/kanji/${encodeURIComponent(decodedWord)}/learn/${encodeURIComponent(decodedWord)}`}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-4 right-4 px-4 py-2 bg-main text-main-foreground shadow-[2px_2px_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] border-2 border-border rounded-base transition-all z-10 flex items-center gap-2"
              title="Learn to write this Kanji"
            >
              <PenLine size={16} strokeWidth={3} />
              <span className="text-sm font-bold">Practice Canvas</span>
           </Link>
           
           <div className="absolute top-4 left-4 flex items-center gap-1.5 text-muted-foreground">
             <Repeat size={14} className="group-hover:-rotate-180 transition-transform duration-500" />
           </div>
        </div>
      </motion.div>
    </div>
  );
}
