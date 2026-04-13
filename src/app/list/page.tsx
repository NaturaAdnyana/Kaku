import { KanjiList } from "@/components/KanjiList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ListPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-bg pb-24 font-sans">
      <main className="mx-auto flex-1 w-full max-w-md p-4 sm:p-6 lg:max-w-lg">
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
          <div className="mb-6 space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Saved Collection
            </p>
            <h2 className="text-3xl font-bold text-center text-foreground">
              My Words
            </h2>
            <p className="text-sm text-muted-foreground">
              Reopen saved words and kanji without the clutter.
            </p>
          </div>

          <Tabs defaultValue="words" className="w-full">
            <div className="mb-6 px-1">
              <TabsList className="w-full bg-background/85 backdrop-blur-sm p-1 space-x-1 h-auto">
                <TabsTrigger value="words" className="flex-1 rounded-sm">
                  Words
                </TabsTrigger>
                <TabsTrigger value="kanji" className="flex-1 rounded-sm">
                  Kanji
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="words" className="mt-0 outline-none">
              <KanjiList type="word" />
            </TabsContent>

            <TabsContent value="kanji" className="mt-0 outline-none">
              <KanjiList type="kanji" />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
