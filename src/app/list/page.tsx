import { KanjiList } from "@/components/KanjiList";

export default function ListPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-zinc-50 dark:bg-black font-sans relative overflow-hidden pb-24">
      <main className="flex-1 w-full max-w-md p-4 mx-auto sm:p-6 lg:max-w-lg">
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
          <h2 className="mb-4 text-2xl font-bold text-center">My Words</h2>
          <KanjiList />
        </div>
      </main>
    </div>
  );
}
