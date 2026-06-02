"use server";

import { db } from "@/lib/db";
import { folder, folderItem } from "@/lib/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { saveWord } from "./kanji";

export async function getFolders() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const folders = await db
      .select({
        id: folder.id,
        name: folder.name,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
        itemCount: sql<number>`cast(count(${folderItem.id}) as integer)`,
      })
      .from(folder)
      .leftJoin(folderItem, eq(folder.id, folderItem.folderId))
      .where(eq(folder.userId, userId))
      .groupBy(folder.id)
      .orderBy(desc(folder.createdAt));

    return { success: true, data: folders };
  } catch (error) {
    console.error("Error fetching folders:", error);
    return { error: "Failed to fetch folders" };
  }
}

export async function createFolder(name: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { error: "Folder name cannot be empty" };
    }

    const newFolder = await db
      .insert(folder)
      .values({
        name: trimmedName,
        userId,
      })
      .returning();

    revalidatePath("/flashcard");
    return { success: true, folder: newFolder[0] };
  } catch (error) {
    console.error("Error creating folder:", error);
    return { error: "Failed to create folder" };
  }
}

export async function updateFolder(id: string, name: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return { error: "Folder name cannot be empty" };
    }

    const existing = await db
      .select()
      .from(folder)
      .where(and(eq(folder.id, id), eq(folder.userId, session.user.id)))
      .limit(1);

    if (existing.length === 0) {
      return { error: "Folder not found or unauthorized" };
    }

    const updated = await db
      .update(folder)
      .set({ name: trimmedName, updatedAt: new Date() })
      .where(eq(folder.id, id))
      .returning();

    revalidatePath("/flashcard");
    return { success: true, folder: updated[0] };
  } catch (error) {
    console.error("Error updating folder:", error);
    return { error: "Failed to update folder" };
  }
}

export async function deleteFolder(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const existing = await db
      .select()
      .from(folder)
      .where(and(eq(folder.id, id), eq(folder.userId, session.user.id)))
      .limit(1);

    if (existing.length === 0) {
      return { error: "Folder not found or unauthorized" };
    }

    await db.delete(folder).where(eq(folder.id, id));

    revalidatePath("/flashcard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting folder:", error);
    return { error: "Failed to delete folder" };
  }
}

export async function getWordFolders(wordValue: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const items = await db
      .select({
        folderId: folderItem.folderId,
      })
      .from(folderItem)
      .innerJoin(folder, eq(folderItem.folderId, folder.id))
      .where(
        and(
          eq(folder.userId, session.user.id),
          eq(folderItem.wordValue, wordValue)
        )
      );

    return { success: true, folderIds: items.map((item) => item.folderId) };
  } catch (error) {
    console.error("Error checking word folders:", error);
    return { error: "Failed to check word folders" };
  }
}

export async function toggleWordInFolder(
  folderId: string,
  wordValue: string,
  action: "add" | "remove"
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const existingFolder = await db
      .select()
      .from(folder)
      .where(and(eq(folder.id, folderId), eq(folder.userId, session.user.id)))
      .limit(1);

    if (existingFolder.length === 0) {
      return { error: "Folder not found or unauthorized" };
    }

    if (action === "add") {
      const existingItem = await db
        .select()
        .from(folderItem)
        .where(
          and(
            eq(folderItem.folderId, folderId),
            eq(folderItem.wordValue, wordValue)
          )
        )
        .limit(1);

      if (existingItem.length > 0) {
        return { success: true, message: "Word already in folder" };
      }

      await db.insert(folderItem).values({
        folderId,
        wordValue,
      });

      // Automatically save to general word list if not already saved
      await saveWord(wordValue);

      return { success: true, message: "Added to folder" };
    } else {
      await db
        .delete(folderItem)
        .where(
          and(
            eq(folderItem.folderId, folderId),
            eq(folderItem.wordValue, wordValue)
          )
        );

      return { success: true, message: "Removed from folder" };
    }
  } catch (error) {
    console.error("Error toggling word in folder:", error);
    return { error: "Failed to toggle word in folder" };
  }
}
