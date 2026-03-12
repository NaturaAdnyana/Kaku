import { getKanjiByWord } from "@/app/actions/kanji";
import { buttonVariants } from "@/components/ui/button-variants";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { DeleteWordButton } from "@/components/DeleteWordButton";
import { cn, getSearchCountColor } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  params: Promise<{
    word: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function KanjiDetailPage({ params }: Props) {
  // Await the params for Next.js 15
  const { word } = await params;
  const decodedWord = decodeURIComponent(word);
  const isSingleKanji = decodedWord.length === 1;

  // 1. Fetch Local Data (searchCount) via Server Action
  const dbData = await getKanjiByWord(decodedWord);

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

  return (
    <div className="flex flex-col min-h-dvh bg-zinc-50 dark:bg-black font-sans relative overflow-hidden pb-24">
      <main className="flex-1 w-full max-w-md p-4 mx-auto sm:p-6 lg:max-w-lg">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href="/list"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "mr-2 text-zinc-600 dark:text-zinc-400 cursor-pointer")}
          >
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-center">Word Details</h1>
          <div className="min-w-10">
            {dbData?.kanji && <DeleteWordButton word={decodedWord} />}
          </div>
        </div>

        <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Word Banner */}
          <div className="flex flex-col items-center justify-center p-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm text-center relative overflow-hidden">
            <span className="text-7xl mb-4">{decodedWord}</span>

            {/* Reading Kana */}
            {apiEntry?.japanese?.[0]?.reading && (
              <span className="text-xl text-blue-600 dark:text-blue-400 font-medium">
                {apiEntry.japanese[0].reading}
              </span>
            )}

            {/* Local Stats Badge */}
            {dbData?.kanji && parseInt(dbData.kanji.searchCount || "0") > 1 && (
              <div
                className={cn(
                  "absolute top-4 right-4 text-xs px-3 py-1 rounded-full flex justify-center gap-1 items-center",
                  getSearchCountColor(
                    parseInt(dbData.kanji.searchCount || "0"),
                  ),
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

          {isSingleKanji ? (
            <Tabs defaultValue="meaning" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-2xl h-auto">
                <TabsTrigger
                  value="meaning"
                  className="rounded-xl data-active:bg-white dark:data-active:bg-zinc-900 data-active:shadow-sm py-3 text-sm font-bold transition-all"
                >
                  Meaning
                </TabsTrigger>
                <TabsTrigger
                  value="words"
                  className="rounded-xl data-active:bg-white dark:data-active:bg-zinc-900 data-active:shadow-sm py-3 text-sm font-bold transition-all"
                >
                  Words
                </TabsTrigger>
              </TabsList>
              <TabsContent value="meaning" className="mt-0">
                <MeaningContent apiEntry={apiEntry} showTitle={false} />
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
                          className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex items-center gap-4 hover:border-blue-500/50 transition-colors cursor-pointer group"
                        >
                          <div className="text-3xl font-medium w-12 text-center group-hover:scale-110 transition-transform">
                            {wordChar}
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              {entry.japanese[0].reading}
                            </span>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 wrap-break-word">
                              {entry.senses[0].english_definitions.join(", ")}
                            </p>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                      No additional words found.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
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
      <div className="p-8 text-center text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
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
          className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col gap-2"
        >
          {/* Part of Speech */}
          {sense.parts_of_speech?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {sense.parts_of_speech.map((pos: string, idx: number) => (
                <span
                  key={idx}
                  className="text-[10px] uppercase font-bold tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-md"
                >
                  {pos}
                </span>
              ))}
            </div>
          )}

          {/* English Definitions */}
          <p className="text-lg font-medium text-zinc-800 dark:text-zinc-100 leading-snug wrap-break-word">
            {sense.english_definitions?.join("; ")}
          </p>
        </div>
      ))}
    </div>
  );
}
