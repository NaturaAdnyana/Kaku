import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // Set provider to PostgreSQL
    schema: {
      ...schema,
    },
  }),
  trustedOrigins: [
    "http://localhost:3000",
    "http://192.168.1.18:3000",
    "https://meiki-natura.vercel.app",
  ],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true, // automatically sign in after registration
  },
  session: {
    // Here we configure the SLIDING SESSION updates.
    // updateAge: we set it to 15 seconds so we can easily demo it. In production, 1 hour (3600) or 1 day (86400) is more realistic.
    // expiresIn: Max session duration without any updates (e.g., 7 days)
    updateAge: 15,
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
  },
});
