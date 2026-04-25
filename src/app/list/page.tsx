import { ListPageContent } from "@/components/ListPageContent";

export default function ListPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-bg pb-24 font-sans">
      <main className="mx-auto flex-1 w-full max-w-md p-4 sm:p-6 lg:max-w-lg">
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
          <div className="mb-6 space-y-3 text-left">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground">
              Hi there
            </p>
            <h2 className="text-3xl font-black leading-tight text-foreground">
              Find your next word to revisit.
            </h2>
            <p className="max-w-sm text-sm font-medium leading-relaxed text-muted-foreground">
              Search your saved words and kanji, then jump back into practice.
            </p>
          </div>
          <ListPageContent />
        </div>
      </main>
    </div>
  );
}
