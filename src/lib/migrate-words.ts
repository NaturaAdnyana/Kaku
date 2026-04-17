import { db } from "./db";
import { kanji, userKanji, word, userWord } from "./schema";
import { eq, sql } from "drizzle-orm";
import * as dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local" });

async function main() {
  console.log("Starting DB migration for Words...");

  // 1. Fetch all kanji that are essentially words (length > 1)
  const multiCharKanjiRecords = await db
    .select()
    .from(kanji)
    .where(sql`LENGTH(${kanji.character}) > 1`);

  console.log(`Found ${multiCharKanjiRecords.length} kanji records that are actually words.`);

  if (multiCharKanjiRecords.length === 0) {
    console.log("Nothing to migrate.");
    process.exit(0);
  }

  for (const record of multiCharKanjiRecords) {
    console.log(`Processing: ${record.character}`);

    let targetWord = await db
      .select()
      .from(word)
      .where(eq(word.word, record.character))
      .limit(1);

    if (targetWord.length === 0) {
      const inserted = await db
        .insert(word)
        .values({
          word: record.character,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        })
        .returning();
      targetWord = inserted;
      console.log(`  Inserted into word table: ${record.character}`);
    } else {
      console.log(`  Word already exists in word table: ${record.character}, skipping insert.`);
    }

    const wordId = targetWord[0].id;

    // Move relations from userKanji to userWord
    const relations = await db
      .select()
      .from(userKanji)
      .where(eq(userKanji.kanjiId, record.id));

    for (const rel of relations) {
      // Check if userWord already exists
      const existingUserWord = await db
        .select()
        .from(userWord)
        .where(sql`${userWord.userId} = ${rel.userId} AND ${userWord.wordId} = ${wordId}`)
        .limit(1);

      if (existingUserWord.length === 0) {
        await db.insert(userWord).values({
          userId: rel.userId,
          wordId: wordId,
          searchCount: rel.searchCount,
          createdAt: rel.createdAt,
          updatedAt: rel.updatedAt,
        });
        console.log(`  Linked to user: ${rel.userId}`);
      }
    }

    // After all is safely moved over, we can delete the record from `kanji`
    // due to cascade, this should also wipe the associated `userKanji`
    await db.delete(kanji).where(eq(kanji.id, record.id));
    console.log(`  Deleted old kanji record: ${record.character}`);
  }

  console.log("Migration complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
