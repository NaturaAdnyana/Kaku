"use server";

import { db } from "@/lib/db";
import { kanji, userKanji } from "@/lib/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function saveKanji(character: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    // 1. Ensure the character exists in the global kanji table
    let kanjiRecord = await db
      .select()
      .from(kanji)
      .where(eq(kanji.character, character))
      .limit(1);

    if (kanjiRecord.length === 0) {
      const inserted = await db
        .insert(kanji)
        .values({ character })
        .returning();
      kanjiRecord = inserted;
    }

    const kanjiId = kanjiRecord[0].id;

    // 2. Check if the user already has this kanji saved
    const existing = await db
      .select()
      .from(userKanji)
      .where(and(eq(userKanji.userId, userId), eq(userKanji.kanjiId, kanjiId)))
      .limit(1);

    if (existing.length > 0) {
      // Increment searchCount
      const currentCount = existing[0].searchCount;
      await db
        .update(userKanji)
        .set({
          searchCount: currentCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(userKanji.id, existing[0].id));

      return {
        success: true,
        message: "Search count updated",
        isNew: false,
        searchCount: currentCount + 1,
      };
    }

    // 3. Save new user-kanji mapping
    await db.insert(userKanji).values({
      userId,
      kanjiId,
      searchCount: 1,
    });

    return {
      success: true,
      message: "Kanji saved",
      isNew: true,
      searchCount: 1,
    };
  } catch (error) {
    console.error("Error saving kanji:", error);
    return { error: "Failed to save kanji" };
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

    let whereClause = eq(userKanji.userId, userId);
    if (search) {
      whereClause = and(
        whereClause,
        sql`${kanji.character} LIKE ${`%${search}%`}`,
      ) as any;
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
        createdAt: userKanji.createdAt,
        updatedAt: userKanji.updatedAt,
      })
      .from(userKanji)
      .innerJoin(kanji, eq(userKanji.kanjiId, kanji.id))
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    // Also get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userKanji)
      .innerJoin(kanji, eq(userKanji.kanjiId, kanji.id))
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count || 0);
    const hasMore = offset + data.length < totalCount;

    return {
      success: true,
      data,
      hasMore,
      totalCount,
    };
  } catch (error) {
    console.error("Error fetching kanji list:", error);
    return { error: "Failed to fetch kanji list" };
  }
}

export async function getKanjiByWord(character: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: true, kanji: null };
    }

    const userId = session.user.id;

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
      .where(and(eq(userKanji.userId, userId), eq(kanji.character, character)))
      .limit(1);

    if (existing.length > 0) {
      return { success: true, kanji: existing[0] };
    }

    return { success: true, kanji: null };
  } catch (error) {
    console.error("Error fetching kanji by word:", error);
    return { error: "Failed to fetch kanji" };
  }
}

export async function deleteKanji(character: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    // We need to find the userKanji record first to delete it
    const subquery = db
      .select({ id: userKanji.id })
      .from(userKanji)
      .innerJoin(kanji, eq(userKanji.kanjiId, kanji.id))
      .where(and(eq(userKanji.userId, userId), eq(kanji.character, character)))
      .limit(1);

    const recordToDelete = await subquery;

    if (recordToDelete.length > 0) {
      await db
        .delete(userKanji)
        .where(eq(userKanji.id, recordToDelete[0].id));
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting kanji:", error);
    return { error: "Failed to delete kanji" };
  }
}
