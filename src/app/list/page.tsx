import { KanjiList } from "@/components/KanjiList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ListPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-zinc-50 dark:bg-black font-sans relative overflow-hidden pb-24">
      <main className="flex-1 w-full max-w-md p-4 mx-auto sm:p-6 lg:max-w-lg">
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
          <h2 className="mb-4 text-2xl font-bold text-center">My Words</h2>
          
          <Tabs defaultValue="words" className="w-full">
            <div className="px-1">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-2xl h-auto">
                <TabsTrigger
                  value="words"
                  className="rounded-xl data-[active=true]:bg-white dark:data-[active=true]:bg-zinc-900 data-[active=true]:shadow-sm py-3 text-sm font-bold transition-all"
                >
                  Words
                </TabsTrigger>
                <TabsTrigger
                  value="kanji"
                  className="rounded-xl data-[active=true]:bg-white dark:data-[active=true]:bg-zinc-900 data-[active=true]:shadow-sm py-3 text-sm font-bold transition-all"
                >
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
