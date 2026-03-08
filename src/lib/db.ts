import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Make sure to load the env variable securely. Drizzle + Neon needs DATABASE_URL
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
