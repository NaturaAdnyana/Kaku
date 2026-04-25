"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { getKanjiList, getWordList, deleteWord } from "@/app/actions/kanji";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { useInView } from "react-intersection-observer";
import { useRouter } from "next/navigation";
import { DeleteConfirmationDialog } from "@/components/kanji-list/DeleteConfirmationDialog";
import {
  KanjiListSkeleton,
  KanjiSkeleton,
} from "@/components/kanji-list/KanjiListSkeleton";
import { ListSearchInput } from "@/components/kanji-list/ListSearchInput";
import {
  ListEmptyState,
  ListErrorState,
} from "@/components/kanji-list/ListStates";
import { ListToolbar } from "@/components/kanji-list/ListToolbar";
import { SavedListItemCard } from "@/components/kanji-list/SavedListItemCard";
import type {
  ListType,
  SavedListItem,
  SortBy,
} from "@/components/kanji-list/types";

export { KanjiListSkeleton, KanjiSkeleton };

const LIST_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 500;
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
    <div className="flex w-full flex-col">
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
        <div className="flex flex-col gap-4">
          {items.map((item, index) => (
            <SavedListItemCard
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
