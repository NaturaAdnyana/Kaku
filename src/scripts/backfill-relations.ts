import { config } from "dotenv";
config({ path: ".env.local" }); // Load from local env
config();

import { db } from "../lib/db";
import { kanji, word, wordKanji } from "../lib/schema";
import { eq, and } from "drizzle-orm";

async function main() {
  console.log("Starting backfill for existing words...");
  const words = await db.select().from(word);
  console.log(`Found ${words.length} vocabulary words in the database.`);

  let insertedCount = 0;

  for (const w of words) {
    // Extract unique kanji characters from the word
    const charSet = new Set(
      Array.from(w.word).filter(c => c.match(/[\u4e00-\u9faf\u3400-\u4dbf]/))
    );

    for (const char of charSet) {
      // 1. Get or create Kanji record (to ensure the relation target exists)
      let kRecord = await db.select().from(kanji).where(eq(kanji.character, char)).limit(1);
      
      if (kRecord.length === 0) {
        const inserted = await db.insert(kanji).values({ character: char }).returning();
        kRecord = inserted;
        console.log(`Created new missing kanji record for: ${char}`);
      }
      const kanjiId = kRecord[0].id;

      // 2. Insert into wordKanji if relation doesn't already exist
      const existingLink = await db
        .select()
        .from(wordKanji)
        .where(and(eq(wordKanji.wordId, w.id), eq(wordKanji.kanjiId, kanjiId)))
        .limit(1);

      if (existingLink.length === 0) {
        await db.insert(wordKanji).values({ wordId: w.id, kanjiId });
        insertedCount++;
        console.log(`Linked [${char}] -> [${w.word}]`);
      }
    }
  }

  console.log(`Backfill complete. Successfully established ${insertedCount} new kanji-word relations.`);
  process.exit(0);
}

main().catch(error => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
