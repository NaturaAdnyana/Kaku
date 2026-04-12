import { buttonVariants } from "@/components/ui/button-variants";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { DeleteWordButton } from "@/components/DeleteWordButton";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KanjiCarousel from "@/components/KanjiCarousel";

type Props = {
  params: Promise<{
    word: string;
  }>;
};

export default async function KanjiDetailPage({ params }: Props) {
  // Await the params for Next.js 15
  const { word } = await params;
  const decodedWord = decodeURIComponent(word);
  const isSingleKanji = decodedWord.length === 1;

  // 2. Fetch Jisho API for Definitions
  let apiEntry = null;
  let allResults = [];
  try {
    const res = await fetch(
      `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(decodedWord)}`,
      { cache: "force-cache" },
    );
    if (res.ok) {
      const jishoData = await res.json();
      allResults = jishoData?.data || [];
      // Find the exact match or first match
      apiEntry =
        allResults.find(
          (d: any) =>
            d.slug === decodedWord ||
            d.japanese?.some((j: any) => j.word === decodedWord),
        ) || allResults[0];
    }
  } catch (e) {
    console.error("Jisho API Error", e);
  }

  // 3. Fetch Kanji API for Single Kanji
  let kanjiApiEntry = null;
  if (isSingleKanji) {
    try {
      const res = await fetch(`https://kanjiapi.dev/v1/kanji/${encodeURIComponent(decodedWord)}`, { cache: "force-cache" });
      if (res.ok) {
        kanjiApiEntry = await res.json();
      }
    } catch (e) {
      console.error("Kanji API Error", e);
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-bg font-sans relative overflow-hidden pb-24">
      <main className="flex-1 w-full max-w-md p-4 mx-auto sm:p-6 lg:max-w-lg">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/list"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "mr-2 text-zinc-600 dark:text-zinc-400 cursor-pointer",
            )}
          >
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-center">Word Details</h1>
          <div className="min-w-10">
            <DeleteWordButton word={decodedWord} />
          </div>
        </div>

        <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Word Banner */}
          <KanjiCarousel
            decodedWord={decodedWord}
            apiEntry={apiEntry}
          />

          {isSingleKanji ? (
            <>
              <KanjiDetailsDisplay kanjiData={kanjiApiEntry} />
              <Tabs defaultValue="meaning" className="w-full">
                <TabsList className="w-full mb-6">
                <TabsTrigger
                  value="meaning"
                  className="w-full"
                >
                  Meaning
                </TabsTrigger>
                <TabsTrigger
                  value="words"
                  className="w-full"
                >
                  Words
                </TabsTrigger>
              </TabsList>
              <TabsContent value="meaning" className="mt-0">
                {kanjiApiEntry && kanjiApiEntry.meanings?.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    <div className="p-5 bg-blank border-2 border-border shadow-shadow rounded-base flex flex-col gap-2">
                      <p className="text-lg font-medium text-foreground leading-snug wrap-break-word capitalize">
                        {kanjiApiEntry.meanings.join(", ")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <MeaningContent apiEntry={apiEntry} showTitle={false} />
                )}
              </TabsContent>
              <TabsContent value="words" className="mt-0">
                <div className="flex flex-col gap-3">
                  {allResults.length > 1 ? (
                    allResults.slice(0, 15).map((entry: any, i: number) => {
                      // Skip the current word if length > 1 (though Jisho results usually start with it)
                      const wordChar = entry.japanese[0].word || entry.slug;
                      return (
                        <Link
                          key={i}
                          href={`/kanji/${encodeURIComponent(wordChar)}`}
                          className="p-4 bg-blank border-2 border-border rounded-base shadow-shadow flex items-center gap-4 hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all cursor-pointer group"
                        >
                          <div className="text-3xl font-bold font-jp w-12 text-center group-hover:scale-110 transition-transform">
                            {wordChar}
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-xs text-foreground font-bold font-jp">
                              {entry.japanese[0].reading}
                            </span>
                            <p className="text-sm text-foreground/80 wrap-break-word font-medium mt-0.5">
                              {entry.senses[0].english_definitions.join(", ")}
                            </p>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-foreground border-2 border-dashed border-border rounded-base bg-secondary">
                      No additional words found.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            </>
          ) : (
            <MeaningContent apiEntry={apiEntry} />
          )}
        </div>
      </main>
    </div>
  );
}

function MeaningContent({
  apiEntry,
  showTitle = true,
}: {
  apiEntry: any;
  showTitle?: boolean;
}) {
  if (!apiEntry) {
    return (
      <div className="p-8 text-center text-foreground border-2 border-dashed border-border rounded-base bg-secondary">
        No definition found on Jisho for this word.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {showTitle && <h2 className="text-lg font-bold px-2">Meanings</h2>}

      {apiEntry.senses?.map((sense: any, index: number) => (
        <div
          key={index}
          className="p-5 bg-blank border-2 border-border shadow-shadow rounded-base flex flex-col gap-2"
        >
          {/* Part of Speech */}
          {sense.parts_of_speech?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {sense.parts_of_speech.map((pos: string, idx: number) => (
                <span
                  key={idx}
                  className="text-[10px] uppercase font-bold tracking-wider bg-secondary border border-border text-foreground px-2 py-0.5 rounded-sm"
                >
                  {pos}
                </span>
              ))}
            </div>
          )}

          <p className="text-lg font-medium text-foreground leading-snug wrap-break-word">
            {sense.english_definitions?.join("; ")}
          </p>
        </div>
      ))}
    </div>
  );
}

function KanjiDetailsDisplay({ kanjiData }: { kanjiData: Record<string, unknown> | null }) {
  if (!kanjiData) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kd = kanjiData as Record<string, any>;
  
  return (
    <div className="bg-blank border-2 border-border rounded-base p-5 shadow-shadow flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 mb-6">
      <div className="grid grid-cols-3 gap-4">
        {kd.jlpt !== null && (
          <div className="flex flex-col gap-1 items-center justify-center p-3 bg-secondary border-2 border-border rounded-base">
            <span className="text-[10px] uppercase text-foreground font-bold tracking-wider">JLPT</span>
            <span className="font-bold text-xl">N{kd.jlpt}</span>
          </div>
        )}
        {kd.grade !== null && (
          <div className="flex flex-col gap-1 items-center justify-center p-3 bg-secondary border-2 border-border rounded-base">
            <span className="text-[10px] uppercase text-foreground font-bold tracking-wider">Grade</span>
            <span className="font-bold text-xl">{kd.grade}</span>
          </div>
        )}
        {kd.stroke_count !== null && (
          <div className="flex flex-col gap-1 items-center justify-center p-3 bg-secondary border-2 border-border rounded-base">
            <span className="text-[10px] uppercase text-foreground font-bold tracking-wider">Strokes</span>
            <span className="font-bold text-xl">{kd.stroke_count}</span>
          </div>
        )}
      </div>

      {(kd.kun_readings?.length > 0 || kd.on_readings?.length > 0) && (
        <div className="flex flex-col gap-5 pt-4 border-t-2 border-border mt-1">
          {kd.kun_readings?.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-foreground">Kun</span>
              <div className="flex flex-wrap gap-2">
                {kd.kun_readings.map((r: string, i: number) => (
                  <span key={i} className="text-sm font-bold px-3 py-1 bg-main text-main-foreground border-2 border-border shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_#FFFFFF] rounded-base">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
          {kd.on_readings?.length > 0 && (
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-xs uppercase font-extrabold tracking-widest text-foreground">On</span>
              <div className="flex flex-wrap gap-2">
                {kd.on_readings.map((r: string, i: number) => (
                  <span key={i} className="text-sm font-bold px-3 py-1 bg-white dark:bg-zinc-800 text-foreground border-2 border-border shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_#FFFFFF] rounded-base">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
