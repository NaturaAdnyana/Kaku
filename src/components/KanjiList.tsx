"use client";

import { useState, useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { getKanjiList, getWordList, deleteKanji, deleteWord } from "@/app/actions/kanji";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ArrowDownAZ, Calendar } from "lucide-react";

// Skeleton component for list items only
export function KanjiListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(count)].map((_, i) => (
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

export function KanjiSkeleton() {
  return (
    <div className="flex flex-col w-full gap-4">
      {/* Search Bar Skeleton */}
      <div className="pt-2 pb-4 px-2 mb-2 flex flex-col gap-4">
        <div className="w-full h-12 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/20 dark:border-zinc-800 rounded-2xl animate-pulse" />
        <div className="flex justify-between items-center px-1">
          <div className="w-32 h-4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
      <KanjiListSkeleton />
    </div>
  );
}

export function KanjiList({ type = "kanji" }: { type?: "kanji" | "word" }) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "most-searched">("newest");

  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: [`${type}-list`, debouncedSearch, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      const getListFn = type === "kanji" ? getKanjiList : getWordList;
      const res = await getListFn(
        pageParam as number,
        20,
        debouncedSearch,
        sortBy,
      );
      if ("error" in res) throw new Error(res.error);
      return res;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  const deleteMutation = useMutation({
    mutationFn: type === "kanji" ? deleteKanji : deleteWord,
    onSuccess: (_, character) => {
      toast.success(`Deleted "${character}" successfully`);
      queryClient.invalidateQueries({ queryKey: [`${type}-list`] });
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
      {/* Search Header - Always Persistent */}
      <div className="sticky top-0 z-10 dark:bg-zinc-950/80 backdrop-blur-md pt-2 pb-4 px-2 mb-2 flex flex-col gap-4">
        <div className="relative group">
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

          <Select
            value={sortBy}
            onValueChange={(val) => {
              if (val === "newest" || val === "most-searched") {
                setSortBy(val);
              }
            }}
          >
            <SelectTrigger className="bg-zinc-100 dark:bg-zinc-900 border-none shadow-none text-zinc-600 dark:text-zinc-400 font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-800 gap-2 h-9 px-3 rounded-xl transition-colors">
              <div className="flex items-center gap-1.5 pointer-events-none">
                {sortBy === "newest" ? (
                  <Calendar size={14} className="shrink-0 text-blue-500" />
                ) : (
                  <ArrowDownAZ size={14} className="shrink-0 text-orange-500" />
                )}
                <span className="truncate">
                  {sortBy === "newest" ? "Newest First" : "Most Searched"}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent align="end" className="min-w-44 p-1.5 rounded-2xl">
              <SelectItem
                value="newest"
                className="rounded-xl focus:bg-zinc-100 dark:focus:bg-zinc-800"
              >
                <div className="flex items-center gap-2 py-0.5">
                  <Calendar size={14} className="text-blue-500" />
                  <span>Newest First</span>
                </div>
              </SelectItem>
              <SelectItem
                value="most-searched"
                className="rounded-xl focus:bg-zinc-100 dark:focus:bg-zinc-800"
              >
                <div className="flex items-center gap-2 py-0.5">
                  <ArrowDownAZ size={14} className="text-orange-500" />
                  <span>Most Searched</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <KanjiListSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-red-500">
          <p>Failed to load Kanji.</p>
          <button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: [`${type}-list`] })
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
              <div
                key={item.id}
                ref={isLast ? ref : null}
                className="group relative flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                <Link
                  href={`/kanji/${encodeURIComponent(item.character)}`}
                  className="absolute inset-0 z-0 rounded-2xl"
                  aria-label={`View details for ${item.character}`}
                />

                <div className="flex items-center gap-4 relative z-10 pointer-events-none">
                  <div className="min-w-12 px-3 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/50 rounded-xl group-hover:bg-orange-50/50 dark:group-hover:bg-orange-900/20 group-hover:border-orange-200 dark:group-hover:border-orange-800/50 transition-colors duration-300 shadow-sm shrink-0">
                    <span className="text-3xl font-semibold font-jp text-zinc-800 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 whitespace-nowrap truncate max-w-40 sm:max-w-xs">
                      {item.character}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 relative z-10 pointer-events-none">
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-3">
                    <div
                      className="text-[10px] sm:text-[11px] font-medium px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50 flex items-center justify-center leading-none"
                      title="Last Updated"
                    >
                      <Calendar
                        size={10}
                        className="mr-1 sm:mr-1.5 opacity-70 sm:w-3 sm:h-3"
                      />
                      {new Date(item.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>

                    <div
                      className={cn(
                        "text-[10px] sm:text-[11px] font-bold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg flex items-center shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/5 leading-none",
                        getSearchCountColor(item.searchCount),
                      )}
                      title="Times Searched"
                    >
                      <Search
                        size={10}
                        className="mr-1 sm:mr-1.5 opacity-70 sm:w-3 sm:h-3"
                        strokeWidth={2.5}
                      />
                      <span>{item.searchCount}</span>
                      <X
                        size={8}
                        className="ml-0.5 opacity-50 sm:w-2.5 sm:h-2.5"
                        strokeWidth={3}
                      />
                    </div>
                  </div>

                  <div className="ml-3 w-px h-8 bg-zinc-200 dark:bg-zinc-800 hidden sm:block opacity-50"></div>

                  <button
                    onClick={(e) => handleDeleteClick(e, item.character)}
                    className="p-3 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:text-red-600 active:bg-red-100 dark:active:bg-red-500/20 rounded-full transition-all duration-200 shrink-0 cursor-pointer pointer-events-auto z-20"
                    title="Delete Word"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
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
