"use server";

import { db } from "@/lib/db";
import { findBestJishoEntry, type JishoResponse } from "@/lib/jisho";
import { kanji, userKanji, word, userWord, wordKanji } from "@/lib/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const JISHO_FETCH_OPTIONS = {
  cache: "force-cache",
  next: { revalidate: false },
} as const;
const JISHO_FLASHCARD_FETCH_DELAY_MS = 150;

export type KanjiApiDetails = {
  meanings?: string[];
  jlpt: number | null;
  grade: number | null;
  stroke_count: number | null;
  kun_readings?: string[];
  on_readings?: string[];
};

export type FlashcardDeckSource = "recent" | "frequent" | "jlpt-random";
export type FlashcardJlptLevel = "n5" | "n4" | "n3" | "n2" | "n1";

export type FlashcardItem = {
  id: string;
  word: string;
  reading?: string;
  meanings: string[];
  partsOfSpeech: string[];
  searchCount?: number;
};

type SavedWordSeed = {
  id: string;
  word: string;
  searchCount: number;
};

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function shuffle<T>(items: T[]) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function flashcardFromJishoEntry(
  entry: NonNullable<JishoResponse["data"]>[number],
  fallbackWord?: string,
): FlashcardItem {
  const japaneseEntry = entry.japanese?.find((item) => item.word) ?? entry.japanese?.[0];
  const wordText = japaneseEntry?.word ?? japaneseEntry?.reading ?? fallbackWord ?? entry.slug;
  const reading = japaneseEntry?.reading;
  const meanings = entry.senses?.[0]?.english_definitions ?? [];
  const partsOfSpeech = entry.senses?.[0]?.parts_of_speech ?? [];

  return {
    id: entry.slug || wordText,
    word: wordText,
    reading: reading && reading !== wordText ? reading : undefined,
    meanings,
    partsOfSpeech,
  };
}

async function fetchJishoFlashcard(wordText: string): Promise<FlashcardItem> {
  const res = await fetch(
    `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(wordText)}`,
    JISHO_FETCH_OPTIONS,
  );

  if (!res.ok) {
    return {
      id: wordText,
      word: wordText,
      meanings: [],
      partsOfSpeech: [],
    };
  }

  const data = (await res.json()) as JishoResponse;
  const entry = findBestJishoEntry(data.data ?? [], wordText);

  if (!entry) {
    return {
      id: wordText,
      word: wordText,
      meanings: [],
      partsOfSpeech: [],
    };
  }

  return flashcardFromJishoEntry(entry, wordText);
}

async function getSavedFlashcardSeeds(
  userId: string,
  source: Extract<FlashcardDeckSource, "recent" | "frequent">,
): Promise<SavedWordSeed[]> {
  const orderBy =
    source === "frequent"
      ? [desc(userWord.searchCount), desc(userWord.updatedAt), desc(userWord.id)]
      : [desc(userWord.updatedAt), desc(userWord.id)];

  return db
    .select({
      id: userWord.id,
      word: word.word,
      searchCount: userWord.searchCount,
    })
    .from(userWord)
    .innerJoin(word, eq(userWord.wordId, word.id))
    .where(eq(userWord.userId, userId))
    .orderBy(...orderBy)
    .limit(10);
}

async function getRandomJlptFlashcards(level: FlashcardJlptLevel = "n2") {
  const res = await fetch(
    `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(`#jlpt-${level} #verb`)}`,
    JISHO_FETCH_OPTIONS,
  );

  if (!res.ok) {
    return { error: "Jisho API response not OK" };
  }

  const data = (await res.json()) as JishoResponse;
  const flashcards = shuffle(data.data ?? [])
    .slice(0, 10)
    .map((entry, index) => ({
      ...flashcardFromJishoEntry(entry),
      id: `${entry.slug || "jlpt"}-${index}`,
    }));

  return { success: true, data: flashcards };
}

export async function getFlashcardDeck(
  source: FlashcardDeckSource,
  options?: { jlptLevel?: FlashcardJlptLevel },
) {
  try {
    if (source === "jlpt-random") {
      return getRandomJlptFlashcards(options?.jlptLevel);
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const seeds = await getSavedFlashcardSeeds(session.user.id, source);
    const flashcards = [];

    for (const [index, seed] of seeds.entries()) {
      if (index > 0) {
        await wait(JISHO_FLASHCARD_FETCH_DELAY_MS);
      }

      flashcards.push({
        ...(await fetchJishoFlashcard(seed.word)),
        id: seed.id,
        word: seed.word,
        searchCount: seed.searchCount,
      });
    }

    return { success: true, data: flashcards };
  } catch (error) {
    console.error("Error fetching flashcard deck:", error);
    return { error: "Failed to fetch flashcard deck" };
  }
}

export async function getJishoReading(text: string) {
  try {
    const flashcard = await fetchJishoFlashcard(text);

    return {
      success: true,
      reading: flashcard.reading ?? flashcard.word,
    };
  } catch (error) {
    console.error("Error fetching Jisho reading:", error);
    return { success: false, error: "Failed to fetch Jisho reading" };
  }
}

export async function saveWord(text: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;
    const isSingleKanji = text.length === 1;

    let targetId: string = "";
    let isNewRecord = false;
    let searchCount = 1;

    if (isSingleKanji) {
      // 1. Single Kanji Logic
      let kanjiRecord = await db
        .select()
        .from(kanji)
        .where(eq(kanji.character, text))
        .limit(1);

      if (kanjiRecord.length === 0) {
        const inserted = await db.insert(kanji).values({ character: text }).returning();
        kanjiRecord = inserted;
      }
      targetId = kanjiRecord[0].id;

      const existing = await db
        .select()
        .from(userKanji)
        .where(and(eq(userKanji.userId, userId), eq(userKanji.kanjiId, targetId)))
        .limit(1);

      if (existing.length > 0) {
        searchCount = existing[0].searchCount + 1;
        await db
          .update(userKanji)
          .set({ searchCount, updatedAt: new Date() })
          .where(eq(userKanji.id, existing[0].id));
      } else {
        isNewRecord = true;
        await db.insert(userKanji).values({ userId, kanjiId: targetId, searchCount: 1 });
      }

    } else {
      // 2. Word Logic
      let wordRecord = await db
        .select()
        .from(word)
        .where(eq(word.word, text))
        .limit(1);

      if (wordRecord.length === 0) {
        const inserted = await db.insert(word).values({ word: text }).returning();
        wordRecord = inserted;
      }
      targetId = wordRecord[0].id;

      const existing = await db
        .select()
        .from(userWord)
        .where(and(eq(userWord.userId, userId), eq(userWord.wordId, targetId)))
        .limit(1);

      if (existing.length > 0) {
        searchCount = existing[0].searchCount + 1;
        await db
          .update(userWord)
          .set({ searchCount, updatedAt: new Date() })
          .where(eq(userWord.id, existing[0].id));
      } else {
        isNewRecord = true;
        await db.insert(userWord).values({ userId, wordId: targetId, searchCount: 1 });
      }

      // Also split the word and save individual kanjis to populate wordKanji relation
      const chars = Array.from(text).filter(c => c.trim().length > 0);
      for (const char of chars) {
        // Simple heuristic to weed out non-kanji characters (approximate)
        if (char.match(/[\u4e00-\u9faf\u3400-\u4dbf]/)) {
           const kResult = await saveWord(char);
           if (kResult.success && kResult.targetId && targetId) {
             const existingLink = await db
               .select()
               .from(wordKanji)
               .where(and(eq(wordKanji.wordId, targetId), eq(wordKanji.kanjiId, kResult.targetId)))
               .limit(1);
               
             if (existingLink.length === 0) {
               await db.insert(wordKanji).values({ wordId: targetId, kanjiId: kResult.targetId });
             }
           }
        }
      }
    }

    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Saved",
      isNew: isNewRecord,
      searchCount: searchCount,
      targetId: targetId,
    };
  } catch (error) {
    console.error("Error saving word:", error);
    return { error: "Failed to save word" };
  }
}

export async function getKanjiList(
  page: number = 1,
  limit: number = 20,
  search?: string,
  sortBy: "newest" | "most-searched" = "newest",
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;
    const offset = (page - 1) * limit;

    let whereClause: ReturnType<typeof and> | ReturnType<typeof eq> = eq(userKanji.userId, userId);
    if (search) {
      whereClause = and(
        whereClause,
        sql`${kanji.character} LIKE ${`%${search}%`}`
      );
    }

    const orderBy =
      sortBy === "most-searched"
        ? [
            desc(userKanji.searchCount),
            desc(userKanji.updatedAt),
            desc(userKanji.id),
          ]
        : [desc(userKanji.updatedAt), desc(userKanji.id)];

    const data = await db
      .select({
        id: userKanji.id,
        userId: userKanji.userId,
        kanjiId: userKanji.kanjiId,
        character: kanji.character,
        searchCount: userKanji.searchCount,
        wordCount: sql<number>`
          (
            select count(distinct ${userWord.wordId})
            from ${wordKanji}
            inner join ${userWord} on ${userWord.wordId} = ${wordKanji.wordId}
            where ${wordKanji.kanjiId} = ${userKanji.kanjiId}
              and ${userWord.userId} = ${userId}
          )
        `,
        createdAt: userKanji.createdAt,
        updatedAt: userKanji.updatedAt,
      })
      .from(userKanji)
      .innerJoin(kanji, eq(userKanji.kanjiId, kanji.id))
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userKanji)
      .innerJoin(kanji, eq(userKanji.kanjiId, kanji.id))
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count || 0);
    const hasMore = offset + data.length < totalCount;

    return { success: true, data, hasMore, totalCount };
  } catch (error) {
    console.error("Error fetching kanji list:", error);
    return { error: "Failed to fetch kanji list" };
  }
}

export async function getWordList(
  page: number = 1,
  limit: number = 20,
  search?: string,
  sortBy: "newest" | "most-searched" = "newest",
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;
    const offset = (page - 1) * limit;

    let whereClause: ReturnType<typeof and> | ReturnType<typeof eq> = eq(userWord.userId, userId);
    if (search) {
      whereClause = and(
        whereClause,
        sql`${word.word} LIKE ${`%${search}%`}`
      );
    }

    const orderBy =
      sortBy === "most-searched"
        ? [
            desc(userWord.searchCount),
            desc(userWord.updatedAt),
            desc(userWord.id),
          ]
        : [desc(userWord.updatedAt), desc(userWord.id)];

    const data = await db
      .select({
        id: userWord.id,
        userId: userWord.userId,
        wordId: userWord.wordId,
        character: word.word,
        searchCount: userWord.searchCount,
        createdAt: userWord.createdAt,
        updatedAt: userWord.updatedAt,
      })
      .from(userWord)
      .innerJoin(word, eq(userWord.wordId, word.id))
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userWord)
      .innerJoin(word, eq(userWord.wordId, word.id))
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count || 0);
    const hasMore = offset + data.length < totalCount;

    return { success: true, data, hasMore, totalCount };
  } catch (error) {
    console.error("Error fetching word list:", error);
    return { error: "Failed to fetch word list" };
  }
}

export async function getKanjiByWord(text: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: true, kanji: null };
    }

    const userId = session.user.id;
    const isSingleKanji = text.length === 1;

    if (isSingleKanji) {
      const existing = await db
        .select({
          id: userKanji.id,
          userId: userKanji.userId,
          kanjiId: userKanji.kanjiId,
          character: kanji.character,
          searchCount: userKanji.searchCount,
          createdAt: userKanji.createdAt,
          updatedAt: userKanji.updatedAt,
        })
        .from(userKanji)
        .innerJoin(kanji, eq(userKanji.kanjiId, kanji.id))
        .where(and(eq(userKanji.userId, userId), eq(kanji.character, text)))
        .limit(1);

      return { success: true, kanji: existing.length > 0 ? existing[0] : null };
    } else {
      const existing = await db
        .select({
          id: userWord.id,
          userId: userWord.userId,
          wordId: userWord.wordId,
          character: word.word, // Keep it named character for compatibility
          searchCount: userWord.searchCount,
          createdAt: userWord.createdAt,
          updatedAt: userWord.updatedAt,
        })
        .from(userWord)
        .innerJoin(word, eq(userWord.wordId, word.id))
        .where(and(eq(userWord.userId, userId), eq(word.word, text)))
        .limit(1);
      
      return { success: true, kanji: existing.length > 0 ? existing[0] : null };
    }
  } catch (error) {
    console.error("Error fetching record:", error);
    return { error: "Failed to fetch record" };
  }
}

export async function deleteWord(text: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;
    const isSingleKanji = text.length === 1;

    if (isSingleKanji) {
      const subquery = db
        .select({ id: userKanji.id })
        .from(userKanji)
        .innerJoin(kanji, eq(userKanji.kanjiId, kanji.id))
        .where(and(eq(userKanji.userId, userId), eq(kanji.character, text)))
        .limit(1);

      const recordToDelete = await subquery;
      if (recordToDelete.length > 0) {
        await db.delete(userKanji).where(eq(userKanji.id, recordToDelete[0].id));
      }
    } else {
      const subquery = db
        .select({ id: userWord.id })
        .from(userWord)
        .innerJoin(word, eq(userWord.wordId, word.id))
        .where(and(eq(userWord.userId, userId), eq(word.word, text)))
        .limit(1);

      const recordToDelete = await subquery;
      if (recordToDelete.length > 0) {
        await db.delete(userWord).where(eq(userWord.id, recordToDelete[0].id));
      }
    }

    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Error deleting:", error);
    return { error: "Failed to delete" };
  }
}

export async function getWordsForKanji(kanjiCharacter: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    // 1. Find kanji ID
    const k = await db.select().from(kanji).where(eq(kanji.character, kanjiCharacter)).limit(1);
    if (!k.length) return { success: true, data: [] };

    // 2. Find words linked to this kanji that THIS USER has saved
    const query = await db
      .select({
        id: userWord.id,
        word: word.word,
        searchCount: userWord.searchCount,
        updatedAt: userWord.updatedAt,
      })
      .from(wordKanji)
      .innerJoin(word, eq(wordKanji.wordId, word.id))
      .innerJoin(userWord, eq(word.id, userWord.wordId))
      .where(and(eq(wordKanji.kanjiId, k[0].id), eq(userWord.userId, userId)))
      .orderBy(desc(userWord.updatedAt));

    return { success: true, data: query };
  } catch (error) {
    console.error("Error fetching words for kanji:", error);
    return { success: false, error: "Failed to fetch words" };
  }
}

export async function getJishoDefinition(word: string) {
  try {
    const res = await fetch(
      `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word)}`,
      JISHO_FETCH_OPTIONS,
    );
    if (res.ok) {
        const data = (await res.json()) as JishoResponse;
        const found = findBestJishoEntry(data.data ?? [], word);

        return { success: true, data: found };
    }
    return { success: false, error: "Jisho API response not OK" };
  } catch (error) {
    console.error("Jisho proxy error:", error);
    return { success: false, error: "Failed to proxy request" };
  }
}

export async function getKanjiApiDetails(
  character: string,
): Promise<{ success: boolean; data?: KanjiApiDetails | null; error?: string }> {
  try {
    const res = await fetch(
      `https://kanjiapi.dev/v1/kanji/${encodeURIComponent(character)}`,
      { cache: "force-cache" },
    );

    if (!res.ok) {
      return { success: false, error: "Kanji API response not OK" };
    }

    return { success: true, data: (await res.json()) as KanjiApiDetails };
  } catch (error) {
    console.error("Kanji API proxy error:", error);
    return { success: false, error: "Failed to proxy kanji request" };
  }
}
