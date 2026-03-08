import { getKanjiByWord } from "@/app/actions/kanji";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteWordButton } from "@/components/DeleteWordButton";
import { cn, getSearchCountColor } from "@/lib/utils";

type Props = {
  params: Promise<{
    word: string;
  }>;
};

export default async function KanjiDetailPage({ params }: Props) {
  // Await the params for Next.js 15
  const { word } = await params;
  const decodedWord = decodeURIComponent(word);

  // 1. Fetch Local Data (searchCount) via Server Action
  const dbData = await getKanjiByWord(decodedWord);

  if (dbData.error && dbData.error === "Unauthorized") {
    redirect("/login");
  }

  // 2. Fetch Jisho API for Definitions
  let apiEntry = null;
  try {
    const res = await fetch(
      `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(decodedWord)}`,
      { cache: "force-cache" },
    );
    // Fallback or error handled transparently
    if (res.ok) {
      const jishoData = await res.json();
      // Find the exact match or first match
      apiEntry =
        jishoData?.data?.find(
          (d: any) =>
            d.slug === decodedWord ||
            d.japanese?.some((j: any) => j.word === decodedWord),
        ) || jishoData?.data?.[0];
    }
  } catch (e) {
    console.error("Jisho API Error", e);
  }

  return (
    <div className="flex flex-col min-h-dvh bg-zinc-50 dark:bg-black font-sans relative overflow-hidden pb-24">
      <main className="flex-1 w-full max-w-md p-4 mx-auto sm:p-6 lg:max-w-lg">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/list">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 text-zinc-600 dark:text-zinc-400 cursor-pointer"
            >
              <ChevronLeft size={24} />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-center">Word Details</h1>
          <DeleteWordButton word={decodedWord} />
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

          {/* Definitions Section */}
          {apiEntry ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold px-2">Meanings</h2>

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
                  <p className="text-lg font-medium text-zinc-800 dark:text-zinc-100 leading-snug">
                    {sense.english_definitions?.join("; ")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              No definition found on Jisho for this word.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
