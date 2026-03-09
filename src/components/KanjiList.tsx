"use client";

import { useState, useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { getKanjiList, deleteKanji } from "@/app/actions/kanji";
import { Loader2, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useDebounce } from "use-debounce";
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
import { useInView } from "react-intersection-observer";
import React from "react";

// Skeleton component for loading state
function KanjiSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-20 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="w-16 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
            <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function KanjiList() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["kanji-list", debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getKanjiList(pageParam as number, 20, debouncedSearch);
      if ("error" in res) throw new Error(res.error);
      return res;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteKanji,
    onSuccess: (_, character) => {
      toast.success(`Deleted "${character}" successfully`);
      queryClient.invalidateQueries({ queryKey: ["kanji-list"] });
    },
    onError: () => {
      toast.error("Failed to delete word.");
    },
  });

  const kanjiItems = useMemo(() => {
    return data?.pages.flatMap((page) => page.data || []) ?? [];
  }, [data]);

  const total = data?.pages[0]?.totalCount ?? 0;

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDeleteClick = (e: React.MouseEvent, character: string) => {
    e.preventDefault();
    e.stopPropagation();
    setCharacterToDelete(character);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (characterToDelete) {
      deleteMutation.mutate(characterToDelete);
    }
    setIsDeleteDialogOpen(false);
    setCharacterToDelete(null);
  };

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Search Header */}
      <div className="sticky top-0 z-10 dark:bg-zinc-950/80 backdrop-blur-md pt-2 pb-4 px-2 mb-2 flex flex-col gap-4">
        <div className="relative group ">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-300 transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search saved words..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-2xl text-sm focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-800 transition-all outline-none border border-zinc-200/20 dark:border-zinc-800"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex justify-between items-center px-1">
          <span className="text-sm text-zinc-500 font-medium">
            {debouncedSearch
              ? `Results for "${debouncedSearch}"`
              : "Saved Words"}
            : {total}
          </span>
        </div>
      </div>

      {isLoading ? (
        <KanjiSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-red-500">
          <p>Failed to load Kanji.</p>
          <button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["kanji-list"] })
            }
            className="text-sm underline mt-2 text-zinc-500"
          >
            Try again
          </button>
        </div>
      ) : kanjiItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500">
          <p>
            {debouncedSearch
              ? "No matches found."
              : "You haven't saved any Kanji yet."}
          </p>
          {!debouncedSearch && (
            <p className="text-sm mt-2">
              Go to the Write tab to start practicing!
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {kanjiItems.map((item, index) => {
            const isLast = index === kanjiItems.length - 1;
            return (
              <Link
                key={item.id}
                href={`/kanji/${encodeURIComponent(item.character)}`}
                ref={isLast ? ref : null}
                className="relative flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-95 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-semibold font-jp">
                    {item.character}
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-zinc-400">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                    <div
                      className={cn(
                        "text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-sm",
                        getSearchCountColor(parseInt(item.searchCount || "0")),
                      )}
                      title="Times Searched"
                    >
                      <Search size={12} className="mr-2" strokeWidth={3} />
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
      )}

      {isFetchingNextPage && (
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
