"use client";

import { use } from "react";
import { LearnCanvas } from "@/components/LearnCanvas";
import { Loader2 } from "lucide-react";
import { BackButton } from "@/components/BackButton";
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
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-bg pb-24 font-sans">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col p-4 sm:p-6 lg:max-w-lg">
        <div className="flex h-full flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="mb-4 flex items-center justify-between">
            <BackButton 
              fallbackUrl={`/kanji/${encodeURIComponent(decodedWord)}`} 
            />
            <div className="flex flex-col items-center text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Learn to Write
              </p>
              <h1 className="text-2xl font-bold text-foreground">
                {decodedKanji}
              </h1>
            </div>
            <div className="w-11" />
          </div>

          <div className="mb-4 rounded-base border-2 border-border bg-blank p-4 text-center shadow-shadow">
            <p className="text-sm font-medium text-foreground">
              Trace over the guide and keep the stroke order roughly correct.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Tip: a touch pen on a touchscreen usually gives the best result.
            </p>
          </div>

          <div className="flex flex-1 flex-col">
            {loading ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-base border-2 border-border bg-blank p-8 text-center shadow-shadow">
                <Loader2 className="h-8 w-8 animate-spin text-foreground" />
                <span className="mt-3 text-sm font-bold text-muted-foreground">
                  Loading guide...
                </span>
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
