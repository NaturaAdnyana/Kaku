import * as dotenv from "dotenv";
dotenv.config();
import { db } from "./db";
import { kanji, userKanji } from "./schema";
import { sql } from "drizzle-orm";

/**
 * MIGRATION SCRIPT
 * 
 * This script migrates data from the old `kanjiList` table (if it still exists in DB)
 * to the new `kanji` and `userKanji` tables.
 * 
 * NOTE: Since we renamed the table in the schema, Drizzle might have already 
 * generated a migration to rename it. If you haven't run the migration yet,
 * you should run this script AFTER applying the schema changes but BEFORE 
 * deleting any old data.
 */

async function migrate() {
  console.log("Starting migration...");

  try {
    // 1. Create new tables if they don't exist
    console.log("Ensuring new tables exist...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "kanji" (
        "id" text PRIMARY KEY NOT NULL,
        "character" text NOT NULL UNIQUE,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "userKanji" (
        "id" text PRIMARY KEY NOT NULL,
        "userId" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
        "kanjiId" text NOT NULL REFERENCES "kanji"("id") ON DELETE cascade,
        "searchCount" integer DEFAULT 1 NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      );
    `);

    // 2. Get all data from the old table
    console.log("Fetching data from 'kanjiList'...");
    const result = await db.execute(sql`SELECT * FROM "kanjiList"`);
    // Neon HTTP driver returns rows in a 'rows' property
    const rows = (result.rows || result) as any[];
    
    if (!rows || rows.length === 0) {
      console.log("No data found in 'kanjiList'. Migration skipped or already done.");
      return;
    }

    console.log(`Found ${rows.length} records to migrate.`);

    for (const row of rows) {
      const { userId, character, searchCount, createdAt, updatedAt } = row;

      // Ensure the character exists in the new 'kanji' table
      const kanjiRecord = await db
        .select()
        .from(kanji)
        .where(sql`character = ${character}`)
        .limit(1);

      let kanjiId;
      if (kanjiRecord.length === 0) {
        const inserted = await db
          .insert(kanji)
          .values({ 
            character,
            createdAt: new Date(createdAt),
            updatedAt: new Date(updatedAt)
          })
          .returning();
        kanjiId = inserted[0].id;
      } else {
        kanjiId = kanjiRecord[0].id;
      }

      // Create the link in 'userKanji'
      await db.insert(userKanji).values({
        userId,
        kanjiId,
        searchCount: parseInt(searchCount || "1", 10),
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt)
      });
    }

    console.log("Migration completed successfully!");
    console.log("Dropping old 'kanjiList' table...");
    await db.execute(sql`DROP TABLE IF EXISTS "kanjiList"`);
    console.log("Success!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

migrate();
