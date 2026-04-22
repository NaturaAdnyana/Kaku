"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

type SavedListItem = {
  id: string;
  userId: string;
  character: string;
  searchCount: number;
  wordCount?: number;
  createdAt: Date;
  updatedAt: Date;
};

type ListType = "kanji" | "word";
type SortBy = "newest" | "most-searched";

const LIST_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 500;
const UPDATED_AT_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});
const LIST_COPY: Record<
  ListType,
  {
    collectionLabel: string;
    entityLabel: string;
    emptyLabel: string;
    searchPlaceholder: string;
  }
> = {
  kanji: {
    collectionLabel: "Saved Kanji",
    entityLabel: "kanji",
    emptyLabel: "You haven't saved any kanji yet.",
    searchPlaceholder: "Search saved kanji...",
  },
  word: {
    collectionLabel: "Saved Words",
    entityLabel: "words",
    emptyLabel: "You haven't saved any words yet.",
    searchPlaceholder: "Search saved words...",
  },
};

export function KanjiListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-4 animate-pulse dark:border-zinc-800 dark:bg-zinc-900/50"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-6 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function KanjiSkeleton() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-10 w-36 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <KanjiListSkeleton />
    </div>
  );
}

function ListSearchInput({
  placeholder,
  value,
  onChange,
  onClear,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 mb-4 pt-2 pb-4">
      <div className="group relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-200"
          size={18}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-base border-2 border-border bg-blank py-3 pl-11 pr-11 text-sm text-foreground shadow-shadow outline-none transition-all placeholder:text-muted-foreground focus:translate-x-boxShadowX focus:translate-y-boxShadowY focus:ring-4 focus:ring-main focus:shadow-none"
        />
        {value && (
          <button
            onClick={onClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function ListSortValue({ sortBy }: { sortBy: SortBy }) {
  const isNewest = sortBy === "newest";

  return (
    <div className="pointer-events-none flex items-center gap-1.5">
      {isNewest ? (
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
        {isNewest ? "Newest First" : "Most Searched"}
      </span>
    </div>
  );
}

function ListToolbar({
  total,
  collectionLabel,
  showResultsLabel,
  sortBy,
  onSortChange,
}: {
  total: number;
  collectionLabel: string;
  showResultsLabel: boolean;
  sortBy: SortBy;
  onSortChange: (value: SortBy) => void;
}) {
  return (
    <div className="sticky top-0 z-10 mb-4 pt-2 pb-2">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-base border-2 border-border bg-main px-3 py-1 text-sm font-bold tabular-nums text-main-foreground shadow-shadow">
            <span>{total}</span>
            <span className="font-normal opacity-80">
              {showResultsLabel ? "results" : collectionLabel}
            </span>
          </span>
        </div>

        <Select
          value={sortBy}
          onValueChange={(value) => {
            if (value === "newest" || value === "most-searched") {
              onSortChange(value);
            }
          }}
        >
          <SelectTrigger className="h-10 w-auto px-4">
            <ListSortValue sortBy={sortBy} />
          </SelectTrigger>
          <SelectContent align="end" className="min-w-44 rounded-base p-1">
            <SelectItem value="newest" className="mb-1.5 rounded-base">
              <div className="flex items-center gap-2 py-0.5">
                <Calendar
                  size={14}
                  className="text-blue-500 dark:text-sky-300"
                />
                <span>Newest First</span>
              </div>
            </SelectItem>
            <SelectItem value="most-searched" className="rounded-base">
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
  );
}

function ListErrorState({
  entityLabel,
  onRetry,
}: {
  entityLabel: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-base border-2 border-dashed border-border bg-blank py-20 text-center text-red-500 shadow-shadow">
      <p>Failed to load saved {entityLabel}.</p>
      <button onClick={onRetry} className="mt-2 text-sm text-zinc-500 underline">
        Try again
      </button>
    </div>
  );
}

function ListEmptyState({
  hasSearch,
  emptyLabel,
}: {
  hasSearch: boolean;
  emptyLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-base border-2 border-dashed border-border bg-blank py-20 text-center text-zinc-500 shadow-shadow dark:text-muted-foreground">
      <p>{hasSearch ? "No matches found." : emptyLabel}</p>
      {!hasSearch && (
        <p className="mt-2 text-sm">Go to the Write tab to start practicing!</p>
      )}
    </div>
  );
}

function SavedListCard({
  item,
  type,
  onOpen,
  onDelete,
  itemRef,
}: {
  item: SavedListItem;
  type: ListType;
  onOpen: (character: string) => void;
  onDelete: (event: React.MouseEvent, character: string) => void;
  itemRef?: ((node?: Element | null) => void) | null;
}) {
  const itemLength = Array.from(item.character).length;
  const updatedLabel = UPDATED_AT_FORMATTER.format(new Date(item.updatedAt));
  const searchLabel = `${item.searchCount} ${
    item.searchCount === 1 ? "search" : "searches"
  }`;

  return (
    <div
      ref={itemRef}
      role="link"
      tabIndex={0}
      className="group relative flex cursor-pointer items-center justify-between gap-4 rounded-base border-2 border-border bg-blank p-4 shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
      onClick={() => onOpen(item.character)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(item.character);
        }
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
                "inline-flex items-center gap-1.5 rounded-base border-2 border-border px-3 py-1 text-xs font-bold",
                getSearchCountColor(item.searchCount),
              )}
              title={searchLabel}
              aria-label={searchLabel}
            >
              <Search size={12} />
              {item.searchCount}
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-base border-2 border-border bg-secondary px-3 py-1 text-xs font-bold text-foreground"
              title="Last Updated"
            >
              <Calendar size={12} className="opacity-70" />
              {updatedLabel}
            </span>
            {type === "kanji" && (
              <span
                className="inline-flex items-center gap-1.5 rounded-base border-2 border-border bg-secondary px-3 py-1 text-xs font-bold text-foreground"
                title="Saved words linked to this kanji"
              >
                <span>{item.wordCount ?? 0}</span>
                <span>{(item.wordCount ?? 0) === 1 ? "word" : "words"}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2">
        <button
          onClick={(event) => onDelete(event, item.character)}
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
}

function DeleteConfirmationDialog({
  open,
  onOpenChange,
  character,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: string | null;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete &quot;
            {character}&quot; from your saved list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function KanjiList({
  type = "kanji",
  externalSearch,
}: {
  type?: ListType;
  externalSearch?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [internalSearch, setInternalSearch] = useState("");
  const searchTerm = externalSearch ?? internalSearch;
  const [debouncedSearch] = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  const { ref, inView } = useInView();
  const { collectionLabel, entityLabel, emptyLabel, searchPlaceholder } =
    LIST_COPY[type];

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
      const response = await getListFn(
        pageParam as number,
        LIST_PAGE_SIZE,
        debouncedSearch,
        sortBy,
      );

      if ("error" in response) {
        throw new Error(response.error);
      }

      return response;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
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

  const items = useMemo(() => {
    return (
      data?.pages.flatMap((page) => (page.data || []) as SavedListItem[]) ?? []
    );
  }, [data]);

  const total = data?.pages[0]?.totalCount ?? 0;

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDeleteClick = (event: React.MouseEvent, character: string) => {
    event.preventDefault();
    event.stopPropagation();
    setCharacterToDelete(character);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenItem = (character: string) => {
    router.push(`/kanji/${encodeURIComponent(character)}`);
  };

  const confirmDelete = () => {
    if (characterToDelete) {
      deleteMutation.mutate(characterToDelete);
    }

    setIsDeleteDialogOpen(false);
    setCharacterToDelete(null);
  };

  return (
    <div className="flex w-full flex-col pb-20">
      {externalSearch === undefined && (
        <ListSearchInput
          placeholder={searchPlaceholder}
          value={internalSearch}
          onChange={setInternalSearch}
          onClear={() => setInternalSearch("")}
        />
      )}

      <ListToolbar
        total={total}
        collectionLabel={collectionLabel}
        showResultsLabel={Boolean(debouncedSearch)}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {isLoading ? (
        <KanjiListSkeleton />
      ) : isError ? (
        <ListErrorState
          entityLabel={entityLabel}
          onRetry={() =>
            queryClient.invalidateQueries({ queryKey: [`${type}-list`] })
          }
        />
      ) : items.length === 0 ? (
        <ListEmptyState
          hasSearch={Boolean(debouncedSearch)}
          emptyLabel={emptyLabel}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <SavedListCard
              key={item.id}
              item={item}
              type={type}
              itemRef={index === items.length - 1 ? ref : null}
              onOpen={handleOpenItem}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {isFetchingNextPage && (
        <div className="flex w-full justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      )}

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        character={characterToDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
