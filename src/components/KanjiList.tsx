"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getKanjiList, deleteKanji } from "@/app/actions/kanji";
import { Loader2, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn, getSearchCountColor } from "@/lib/utils";

export function KanjiList() {
  const [kanjiData, setKanjiData] = useState<
    {
      id: string;
      character: string;
      searchCount: string;
      updatedAt: Date | string;
    }[]
  >([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);

  const fetchKanji = useCallback(
    async (pageNum: number) => {
      if (loading) return;
      setLoading(true);
      try {
        const response = await getKanjiList(pageNum, 20);
        if (response.success && response.data) {
          setKanjiData((prev) =>
            pageNum === 1 ? response.data! : [...prev, ...response.data!],
          );
          setHasMore(response.hasMore || false);
          if (response.totalCount !== undefined) {
            setTotal(response.totalCount);
          }
        }
      } catch (error) {
        console.error("Failed to load kanji:", error);
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  useEffect(() => {
    fetchKanji(1);
    // Only fetch once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteClick = (e: React.MouseEvent, character: string) => {
    e.preventDefault();
    e.stopPropagation();
    setCharacterToDelete(character);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!characterToDelete) return;

    const res = await deleteKanji(characterToDelete);
    if (res?.success) {
      toast.success(`Deleted "${characterToDelete}" successfully`);
      setKanjiData((prev) =>
        prev.filter((k) => k.character !== characterToDelete),
      );
      setTotal((prev) => prev - 1);
    } else {
      toast.error("Failed to delete word.");
    }
    setIsDeleteDialogOpen(false);
    setCharacterToDelete(null);
  };

  const lastElementRef = useCallback(
    (node: HTMLAnchorElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchKanji(nextPage);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, page, fetchKanji],
  );

  if (loading && page === 1) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="animate-spin text-zinc-500 w-8 h-8" />
      </div>
    );
  }

  if (kanjiData.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center text-zinc-500">
        <p>You haven&apos;t saved any Kanji yet.</p>
        <p className="text-sm mt-2">Go to the Write tab to start practicing!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-20">
      <div className="flex justify-between items-center mb-4 px-2">
        <span className="text-sm text-zinc-500 font-medium">
          Saved Words: {total}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {kanjiData.map((item, index) => {
          const isLastElement = index === kanjiData.length - 1;
          return (
            <Link
              key={item.id}
              href={`/kanji/${encodeURIComponent(item.character)}`}
              ref={isLastElement ? lastElementRef : null}
              className="relative flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl font-semibold">{item.character}</span>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-zinc-400">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </span>
                  {/* Search Count Badge */}
                  <div
                    className={cn(
                      "text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-sm",
                      getSearchCountColor(parseInt(item.searchCount || "0")),
                    )}
                    title="Times Searched"
                  >
                    <Search size={12} className="mr-2" />
                    {item.searchCount}
                    <X size={10} strokeWidth={4} />
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteClick(e, item.character)}
                  className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:text-red-600 active:bg-red-100 dark:active:bg-red-500/20 rounded-full transition-all duration-200 shrink-0 cursor-pointer"
                  title="Delete Word"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </Link>
          );
        })}
      </div>

      {loading && page > 1 && (
        <div className="w-full flex justify-center p-6">
          <Loader2 className="animate-spin text-zinc-500 w-6 h-6" />
        </div>
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete &quot;
              {characterToDelete}&quot; from your saved list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
