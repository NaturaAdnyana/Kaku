"use client";

import { useState, useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { getKanjiList, getWordList, deleteWord } from "@/app/actions/kanji";
import {
  ArrowDownAZ,
  Calendar,
  Loader2,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
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
        <div className="w-full h-12 bg-secondary border-2 border-border rounded-base animate-pulse shadow-shadow" />
        <div className="flex justify-between items-center px-1">
          <div className="w-32 h-4 bg-secondary rounded animate-pulse" />
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
    mutationFn: deleteWord,
    onSuccess: (_, character) => {
      toast.success(`Deleted "${character}" successfully`);
      queryClient.invalidateQueries({ queryKey: [`${type}-list`] });
    },
    onError: () => {
      toast.error("Failed to delete word.");
    },
  });

  const kanjiItems = useMemo(() => {
    type BaseItem = { id: string; userId: string; character: string; searchCount: number; createdAt: Date; updatedAt: Date };
    return data?.pages.flatMap((page) => (page.data || []) as BaseItem[]) ?? [];
  }, [data]);


  const total = data?.pages[0]?.totalCount ?? 0;
  const collectionLabel = type === "kanji" ? "Saved Kanji" : "Saved Words";
  const entityLabel = type === "kanji" ? "kanji" : "words";
  const emptyLabel =
    type === "kanji"
      ? "You haven't saved any kanji yet."
      : "You haven't saved any words yet.";

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
      <div className="sticky top-0 z-10 mb-4 pt-2 pb-4">
        <div className="flex flex-col gap-3">
          <div className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-200"
              size={18}
            />
            <input
              type="text"
              placeholder={`Search ${type === "kanji" ? "saved kanji" : "saved words"}...`}
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

          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className="inline-flex items-center border-2 border-border bg-main px-3 py-1 text-sm font-bold text-main-foreground shadow-shadow rounded-base">
                {total} {total === 1 ? "item" : "items"}
              </span>
              <span className="truncate text-sm font-bold text-foreground">
                {debouncedSearch
                  ? `Results for "${debouncedSearch}"`
                  : collectionLabel}
              </span>
            </div>

            <Select
              value={sortBy}
              onValueChange={(val) => {
                if (val === "newest" || val === "most-searched") {
                  setSortBy(val);
                }
              }}
            >
              <SelectTrigger className="h-10 w-auto px-4">
                <div className="pointer-events-none flex items-center gap-1.5">
                  {sortBy === "newest" ? (
                    <Calendar
                      size={14}
                      className="shrink-0 text-blue-500 dark:text-sky-300"
                    />
                  ) : (
                    <ArrowDownAZ
                      size={14}
                      className="shrink-0 text-orange-500 dark:text-amber-300"
                    />
                  )}
                  <span className="truncate">
                    {sortBy === "newest" ? "Newest First" : "Most Searched"}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent
                align="end"
                className="min-w-44 rounded-base p-1.5"
              >
                <SelectItem
                  value="newest"
                  className="rounded-base"
                >
                  <div className="flex items-center gap-2 py-0.5">
                    <Calendar
                      size={14}
                      className="text-blue-500 dark:text-sky-300"
                    />
                    <span>Newest First</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="most-searched"
                  className="rounded-base"
                >
                  <div className="flex items-center gap-2 py-0.5">
                    <ArrowDownAZ
                      size={14}
                      className="text-orange-500 dark:text-amber-300"
                    />
                    <span>Most Searched</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <KanjiListSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-base border-2 border-dashed border-border bg-blank py-20 text-center text-red-500 shadow-shadow">
          <p>Failed to load saved {entityLabel}.</p>
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
        <div className="flex flex-col items-center justify-center rounded-base border-2 border-dashed border-border bg-blank py-20 text-center text-zinc-500 shadow-shadow dark:text-muted-foreground">
          <p>{debouncedSearch ? "No matches found." : emptyLabel}</p>
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
            const itemLength = Array.from(item.character).length;
            const updatedLabel = new Date(item.updatedAt).toLocaleDateString(
              undefined,
              {
                month: "short",
                day: "numeric",
              },
            );

            return (
              <div
                key={item.id}
                ref={isLast ? ref : null}
                className="group relative flex cursor-pointer items-center justify-between gap-4 rounded-base border-2 border-border bg-blank p-4 shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
                onClick={() => {
                  window.location.href = `/kanji/${encodeURIComponent(item.character)}`;
                }}
              >
                <div className="relative z-10 flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex h-14 min-w-14 max-w-full shrink-0 items-center justify-center rounded-base border-2 border-border bg-main px-3 transition-colors duration-300 group-hover:bg-accent">
                    <span
                      className={cn(
                        "truncate font-jp font-bold leading-none text-main-foreground",
                        itemLength > 3
                          ? "text-lg"
                          : itemLength > 1
                            ? "text-2xl"
                            : "text-4xl",
                      )}
                    >
                      {item.character}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-base border-2 border-border px-3 py-1 text-xs font-bold shadow-[2px_2px_0_var(--shadow-color)]",
                          getSearchCountColor(item.searchCount),
                        )}
                      >
                        <Search size={12} />
                        {item.searchCount}{" "}
                        {item.searchCount === 1 ? "search" : "searches"}
                      </span>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-base border-2 border-border bg-secondary px-3 py-1 text-xs font-bold text-foreground shadow-[2px_2px_0_var(--shadow-color)]"
                        title="Last Updated"
                      >
                        <Calendar size={12} className="opacity-70" />
                        {updatedLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex items-center gap-2">
                  <button
                    onClick={(e) => handleDeleteClick(e, item.character)}
                    className="group/btn z-20 flex shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-border bg-danger p-2.5 font-bold text-white shadow-shadow transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
                    title="Delete"
                  >
                    <Trash2
                      size={15}
                      className="transition-transform group-hover/btn:scale-110"
                    />
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
