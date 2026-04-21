export type JishoJapaneseEntry = {
  word?: string;
  reading?: string;
};

export type JishoSense = {
  english_definitions?: string[];
  parts_of_speech?: string[];
};

export type JishoEntry = {
  slug: string;
  japanese?: JishoJapaneseEntry[];
  senses?: JishoSense[];
};

export type JishoResponse = {
  data?: JishoEntry[];
};

export function findBestJishoEntry(
  entries: JishoEntry[],
  targetWord: string,
): JishoEntry | null {
  return (
    entries.find(
      (entry) =>
        entry.slug === targetWord ||
        entry.japanese?.some((japaneseEntry) => japaneseEntry.word === targetWord),
    ) ??
    entries[0] ??
    null
  );
}

export function getPrimaryJishoReading(entry: JishoEntry | null) {
  return entry?.japanese?.[0]?.reading;
}

export function getPrimaryJishoDefinition(entry: JishoEntry | null) {
  return entry?.senses?.[0]?.english_definitions?.join(", ");
}
