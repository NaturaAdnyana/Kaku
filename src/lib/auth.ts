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
  plugins: [
    {
      id: "turnstile",
      hooks: {
        before: [
          {
            matcher: (context) => context.path === "/sign-up/email",
            handler: async (context) => {
              const headers = context.headers;
              let token: string | null = null;

              if (headers instanceof Headers) {
                token = headers.get("x-turnstile-token");
              } else if (Array.isArray(headers)) {
                token =
                  headers.find(
                    ([k]) => k.toLowerCase() === "x-turnstile-token",
                  )?.[1] || null;
              } else if (headers && typeof headers === "object") {
                token = (headers as Record<string, string>)[
                  "x-turnstile-token"
                ];
              }

              if (!token) {
                return {
                  error: {
                    message: "Verification failed. Please try again.",
                    status: 400,
                  },
                };
              }

              const secretKey = process.env.TURNSTILE_SECRET_KEY;
              const response = await fetch(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                  body: `secret=${secretKey}&response=${token}`,
                },
              );

              const outcome = await response.json();
              if (!outcome.success) {
                return {
                  error: {
                    message: "Invalid verification token. Please try again.",
                    status: 400,
                  },
                };
              }
            },
          },
        ],
      },
    },
  ],
  trustedOrigins: [
    "http://localhost:3000",
    "http://192.168.1.18:3000",
    "https://meiki-natura.vercel.app",
    "https://kaku-nulis.vercel.app",
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
