"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [sessionInfo, setSessionInfo] = useState<{
    user: { name?: string; email: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await authClient.getSession();
        if (error || !data) {
          setSessionInfo(null);
        } else {
          setSessionInfo(data);
        }
      } catch (err) {
        console.error(err);
        setSessionInfo(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-zinc-50 dark:bg-black">
        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
      </div>
    );
  }

  // Not Logged In View
  if (!sessionInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-zinc-50 dark:bg-black p-4">
        <Card className="w-full max-w-md shadow-lg rounded-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Meiki (銘記)</CardTitle>
            <CardDescription>Remember Kanji better.</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pb-8">
            <Link href="/login" className="w-full">
              <Button className="w-full h-12 text-lg rounded-xl">
                Login / Sign Up
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Logged In Landing Page
  return (
    <div className="flex flex-col min-h-dvh bg-zinc-50 dark:bg-black font-sans relative overflow-hidden pb-24">
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-md p-4 mx-auto sm:p-6 lg:max-w-lg text-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Ready to practice?
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Hi, {sessionInfo.user.name || sessionInfo.user.email}! Let&apos;s
            write some Kanji.
          </p>
        </div>

        <Link href="/write" className="w-full">
          <Button
            size="lg"
            className="w-full h-16 text-xl rounded-2xl shadow-lg hover:scale-105 transition-transform cursor-pointer"
          >
            Start write kanji
          </Button>
        </Link>
      </main>
    </div>
  );
}
