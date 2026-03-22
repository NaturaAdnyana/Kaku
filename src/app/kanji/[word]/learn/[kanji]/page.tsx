"use client";

import { use } from "react";
import { LearnCanvas } from "@/components/LearnCanvas";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSvgAnimations } from "@/hooks/useSvgAnimations";

type Props = {
  params: Promise<{
    word: string;
    kanji: string;
  }>;
};

export default function LearnKanjiPage({ params }: Props) {
  const { word, kanji } = use(params);
  const decodedWord = decodeURIComponent(word);
  const decodedKanji = decodeURIComponent(kanji);

  const { animations, loading } = useSvgAnimations(decodedKanji);
  const svgContent = animations.length > 0 ? animations[0].svgContent : "";

  return (
    <div className="flex flex-col min-h-dvh bg-zinc-50 dark:bg-black font-sans relative">
      <main className="flex flex-col flex-1 w-full max-w-md mx-auto lg:max-w-xl shadow-sm bg-white dark:bg-zinc-950/50 relative">
        {/* Header Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
          <Link
            href={`/kanji/${encodeURIComponent(decodedWord)}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "mr-2 text-zinc-600 dark:text-zinc-400 cursor-pointer",
            )}
            aria-label="Back to word details"
          >
            <ChevronLeft size={24} />
          </Link>
          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold">Learn to Write</h1>
            <span className="text-xs text-zinc-500 font-medium">
              Target: {decodedKanji}
            </span>
          </div>
          <div className="min-w-10"></div>
        </div>

        <div className="flex-1 flex flex-col p-4">
          <div className="flex flex-col items-center text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Trace over the faint background guide.
              <br /> Make sure to get the stroke order roughly correct for
              better recognition.
              <br />
              <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                Tip: Use a touch pen on a touchscreen for a better experience.
              </span>
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-2 text-zinc-400">
                <Loader2 className="animate-spin w-8 h-8" />
                <span className="text-sm text-zinc-500">Loading guide...</span>
              </div>
            ) : (
              <LearnCanvas targetKanji={decodedKanji} svgContent={svgContent} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
