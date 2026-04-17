import { BackButton } from "@/components/BackButton";
import { WordDetailCard } from "@/components/WordDetailCard";
import { DeleteWordButton } from "@/components/DeleteWordButton";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { URLTabs } from "@/components/URLTabs";
import { KanjiBanner } from "@/components/KanjiBanner";
import { getWordsForKanji } from "@/app/actions/kanji";
import { Suspense } from "react";
import { TabPendingContent } from "@/components/TabPendingContent";

type JishoJapaneseEntry = {
  word?: string;
  reading?: string;
};

type JishoSense = {
  english_definitions?: string[];
  parts_of_speech?: string[];
};

type JishoEntry = {
  slug: string;
  japanese?: JishoJapaneseEntry[];
  senses?: JishoSense[];
};

type KanjiApiEntry = {
  meanings?: string[];
  jlpt: number | null;
  grade: number | null;
  stroke_count: number | null;
  kun_readings?: string[];
  on_readings?: string[];
};

type SavedWord = {
  id: string;
  word: string;
  searchCount: number;
};

type Props = {
  params: Promise<{
    word: string;
  }>;
};

async function getJishoResults(decodedWord: string): Promise<JishoEntry[]> {
  try {
    const res = await fetch(
      `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(decodedWord)}`,
      { cache: "force-cache" },
    );
    if (!res.ok) {
      return [];
    }

    const jishoData = (await res.json()) as { data?: JishoEntry[] };
    return jishoData.data ?? [];
  } catch (error) {
    console.error("Jisho API Error", error);
    return [];
  }
}

async function getKanjiDetails(
  decodedWord: string,
  isSingleKanji: boolean,
): Promise<KanjiApiEntry | null> {
  if (!isSingleKanji) {
    return null;
  }

  try {
    const res = await fetch(
      `https://kanjiapi.dev/v1/kanji/${encodeURIComponent(decodedWord)}`,
      { cache: "force-cache" },
    );

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as KanjiApiEntry;
  } catch (error) {
    console.error("Kanji API Error", error);
    return null;
  }
}

export default async function KanjiDetailPage({ params }: Props) {
  const { word } = await params;
  const decodedWord = decodeURIComponent(word);
  const isSingleKanji = decodedWord.length === 1;

  const [allResults, kanjiApiEntry] = await Promise.all([
    getJishoResults(decodedWord),
    getKanjiDetails(decodedWord, isSingleKanji),
  ]);
  const apiEntry =
    allResults.find(
      (entry) =>
        entry.slug === decodedWord ||
        entry.japanese?.some((japaneseEntry) => japaneseEntry.word === decodedWord),
    ) ?? allResults[0] ?? null;

  return (
    <div className="flex flex-col min-h-dvh bg-bg font-sans relative overflow-hidden pb-24">
      <main className="flex-1 w-full max-w-md p-4 mx-auto sm:p-6 lg:max-w-lg">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <BackButton className="mr-2 text-zinc-600 dark:text-zinc-400" />
          <h1 className="text-xl font-bold text-center">Word Details</h1>
          <div className="min-w-10">
            <DeleteWordButton word={decodedWord} />
          </div>
        </div>

        <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Word Banner */}
          <KanjiBanner decodedWord={decodedWord} apiEntry={apiEntry} />

          {isSingleKanji ? (
            <>
              <KanjiDetailsDisplay kanjiData={kanjiApiEntry} />
              <URLTabs defaultValue="meaning" className="w-full">
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="meaning" className="w-full">
                    Meaning
                  </TabsTrigger>
                  <TabsTrigger value="words" className="w-full">
                    Words
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="meaning" className="mt-0">
                  <TabPendingContent
                    skeleton={
                      <div className="flex flex-col gap-3">
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className="p-5 bg-blank border-2 border-border shadow-shadow rounded-base h-20 animate-pulse" />
                        ))}
                      </div>
                    }
                  >
                    {kanjiApiEntry && kanjiApiEntry.meanings?.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        <div className="p-5 bg-blank border-2 border-border shadow-shadow rounded-base flex flex-col gap-2">
                          <p className="text-lg font-medium text-foreground leading-snug capitalize">
                            {kanjiApiEntry.meanings.join(", ")}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <MeaningContent apiEntry={apiEntry} showTitle={false} />
                    )}
                  </TabPendingContent>
                </TabsContent>
                <TabsContent value="words" className="mt-0">
                  <TabPendingContent
                    skeleton={
                      <div className="p-8 text-center font-bold text-foreground border-2 border-dashed border-border rounded-base bg-secondary shadow-shadow animate-pulse">
                        Loading vocabulary...
                      </div>
                    }
                  >
                    <Suspense
                      fallback={
                        <div className="p-8 text-center font-bold text-foreground border-2 border-dashed border-border rounded-base bg-secondary shadow-shadow">
                          Loading vocabulary...
                        </div>
                      }
                    >
                      <WordsTabContent
                        decodedWord={decodedWord}
                        allResults={allResults}
                      />
                    </Suspense>
                  </TabPendingContent>
                </TabsContent>
              </URLTabs>
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
  apiEntry: JishoEntry | null;
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

      {apiEntry.senses?.map((sense, index) => (
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

function KanjiDetailsDisplay({
  kanjiData,
}: {
  kanjiData: KanjiApiEntry | null;
}) {
  if (!kanjiData) return null;
  const kd = kanjiData;

  return (
    <div className="bg-blank border-2 border-border rounded-base p-5 shadow-shadow flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 mb-6">
      <div className="grid grid-cols-3 gap-4">
        {kd.jlpt !== null && (
          <div className="flex flex-col gap-1 items-center justify-center p-3 bg-secondary border-2 border-border rounded-base">
            <span className="text-[10px] uppercase text-foreground font-bold tracking-wider">
              JLPT
            </span>
            <span className="font-bold text-xl">N{kd.jlpt}</span>
          </div>
        )}
        {kd.grade !== null && (
          <div className="flex flex-col gap-1 items-center justify-center p-3 bg-secondary border-2 border-border rounded-base">
            <span className="text-[10px] uppercase text-foreground font-bold tracking-wider">
              Grade
            </span>
            <span className="font-bold text-xl">{kd.grade}</span>
          </div>
        )}
        {kd.stroke_count !== null && (
          <div className="flex flex-col gap-1 items-center justify-center p-3 bg-secondary border-2 border-border rounded-base">
            <span className="text-[10px] uppercase text-foreground font-bold tracking-wider">
              Strokes
            </span>
            <span className="font-bold text-xl">{kd.stroke_count}</span>
          </div>
        )}
      </div>

      {(kd.kun_readings?.length > 0 || kd.on_readings?.length > 0) && (
        <div className="flex flex-col gap-5 pt-4 border-t-2 border-border mt-1">
          {kd.kun_readings?.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-foreground">
                Kun
              </span>
              <div className="flex flex-wrap gap-2">
                {kd.kun_readings.map((r: string, i: number) => (
                  <span
                    key={i}
                    className="text-sm font-bold px-3 py-1 bg-main text-main-foreground border-2 border-border shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_#FFFFFF] rounded-base"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
          {kd.on_readings?.length > 0 && (
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-xs uppercase font-extrabold tracking-widest text-foreground">
                On
              </span>
              <div className="flex flex-wrap gap-2">
                {kd.on_readings.map((r: string, i: number) => (
                  <span
                    key={i}
                    className="text-sm font-bold px-3 py-1 bg-main text-main-foreground border-2 border-border shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_#FFFFFF] rounded-base"
                  >
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

async function WordsTabContent({
  decodedWord,
  allResults,
}: {
  decodedWord: string;
  allResults: JishoEntry[];
}) {
  let savedWords: SavedWord[] = [];
  try {
    const wordsRes = await getWordsForKanji(decodedWord);
    if (wordsRes.success && wordsRes.data) {
      savedWords = wordsRes.data as SavedWord[];
    }
  } catch (error) {
    console.error("DB API Error in WordsTabContent", error);
  }

  const savedWordSet = new Set(savedWords.map((savedWord) => savedWord.word));
  const dictionaryWords = allResults
    .slice(0, 15)
    .filter((entry) => {
      const wordChar = entry.japanese?.[0]?.word || entry.slug;
      return wordChar !== decodedWord && !savedWordSet.has(wordChar);
    });

  return (
    <div className="flex flex-col gap-6">
      {/* User's Saved Words */}
      {savedWords.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold px-2">Your Saved Words</h2>
          {savedWords.map((userWord) => (
            <WordDetailCard
              key={userWord.id}
              word={userWord.word}
              isSaved={true}
              searchCount={userWord.searchCount}
            />
          ))}
        </div>
      )}

      {/* Dictionary Words */}
      <div className="flex flex-col gap-3">
        {savedWords.length > 0 && (
          <h2 className="text-lg font-bold px-2">Dictionary</h2>
        )}
        {dictionaryWords.length > 0 ? (
          dictionaryWords.map((entry) => {
            const wordChar = entry.japanese?.[0]?.word || entry.slug;

            return (
              <WordDetailCard
                key={`${entry.slug}-${wordChar}`}
                word={wordChar}
                initialEntry={entry}
                isSaved={false}
              />
            );
          })
        ) : (
          <div className="p-8 text-center text-foreground border-2 border-dashed border-border rounded-base bg-secondary shadow-[4px_4px_0_var(--border)]">
            No additional words found.
          </div>
        )}
      </div>
    </div>
  );
}
