export type SavedListItem = {
  id: string;
  userId: string;
  character: string;
  searchCount: number;
  wordCount?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ListType = "kanji" | "word";
export type SortBy = "newest" | "most-searched";

