"use server";

import { db } from "@/lib/db";
import { kanjiList } from "@/lib/schema";
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

    // Check if the user already has this kanji saved
    const existing = await db
      .select()
      .from(kanjiList)
      .where(
        and(eq(kanjiList.userId, userId), eq(kanjiList.character, character)),
      )
      .limit(1);

    if (existing.length > 0) {
      // Increment searchCount
      const currentCount = parseInt(existing[0].searchCount || "0", 10);
      await db
        .update(kanjiList)
        .set({
          searchCount: (currentCount + 1).toString(),
          updatedAt: new Date(),
        })
        .where(eq(kanjiList.id, existing[0].id));

      return {
        success: true,
        message: "Search count updated",
        isNew: false,
        searchCount: currentCount + 1,
      };
    }

    // Save new kanji
    await db.insert(kanjiList).values({
      userId,
      character,
      searchCount: "1",
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

export async function getKanjiList(page: number = 1, limit: number = 20) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;
    const offset = (page - 1) * limit;

    const data = await db
      .select()
      .from(kanjiList)
      .where(eq(kanjiList.userId, userId))
      .orderBy(desc(kanjiList.updatedAt))
      .limit(limit)
      .offset(offset);

    // Also get total count to know if there are more
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(kanjiList)
      .where(eq(kanjiList.userId, userId));

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
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const existing = await db
      .select()
      .from(kanjiList)
      .where(
        and(eq(kanjiList.userId, userId), eq(kanjiList.character, character)),
      )
      .limit(1);

    if (existing.length > 0) {
      return { success: true, kanji: existing[0] };
    }

    return { success: false, error: "Not found" };
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

    await db
      .delete(kanjiList)
      .where(
        and(eq(kanjiList.userId, userId), eq(kanjiList.character, character)),
      );

    return { success: true };
  } catch (error) {
    console.error("Error deleting kanji:", error);
    return { error: "Failed to delete kanji" };
  }
}
