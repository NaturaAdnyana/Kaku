"use client";

import { useState } from "react";
import { X, Search } from "lucide-react";
import { KanjiList } from "@/components/KanjiList";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { URLTabs } from "@/components/URLTabs";
import { TabPendingContent } from "@/components/TabPendingContent";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ListPageContentInner() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "words";
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <>
      {/* Persistent shared search bar — survives tab switches */}
      <div className="sticky top-0 z-10 mb-4 pt-2 pb-4">
        <div className="relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-200"
            size={18}
          />
          <input
            type="text"
            placeholder={
              activeTab === "kanji"
                ? "Search saved kanji..."
                : "Search saved words..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-blank border-2 border-border shadow-shadow rounded-base text-sm text-foreground py-3 pr-11 pl-11 outline-none transition-all placeholder:text-muted-foreground focus:ring-4 focus:ring-main focus:translate-x-boxShadowX focus:translate-y-boxShadowY focus:shadow-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <URLTabs defaultValue="words" className="w-full">
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
          <TabPendingContent>
            <KanjiList type="word" externalSearch={searchTerm} />
          </TabPendingContent>
        </TabsContent>

        <TabsContent value="kanji" className="mt-0 outline-none">
          <TabPendingContent>
            <KanjiList type="kanji" externalSearch={searchTerm} />
          </TabPendingContent>
        </TabsContent>
      </URLTabs>
    </>
  );
}

export function ListPageContent() {
  return (
    <Suspense fallback={null}>
      <ListPageContentInner />
    </Suspense>
  );
}
