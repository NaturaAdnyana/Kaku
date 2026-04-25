"use client";

import { useState } from "react";
import { KanjiList } from "@/components/KanjiList";
import { ListSearchInput } from "@/components/kanji-list/ListSearchInput";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { URLTabs } from "@/components/URLTabs";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ListPageContentInner() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "words";
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <>
      <ListSearchInput
        placeholder={
          activeTab === "kanji"
            ? "Search saved kanji..."
            : "Search saved words..."
        }
        value={searchTerm}
        onChange={setSearchTerm}
        onClear={() => setSearchTerm("")}
      />

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
          <KanjiList type="word" externalSearch={searchTerm} />
        </TabsContent>

        <TabsContent value="kanji" className="mt-0 outline-none">
          <KanjiList type="kanji" externalSearch={searchTerm} />
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
