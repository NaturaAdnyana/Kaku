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
import { ArrowRight, Loader2, Info } from "lucide-react";
import { OwlLogo } from "@/components/OwlLogo";

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
            <div className="flex justify-center">
              <OwlLogo className="w-24 h-24" />
            </div>
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
              Meiki (銘記)
              <Link href="/about">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-8 h-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <Info className="w-5 h-5" />
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>Remember Kanji better.</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pb-8">
            <Link href="/login" className="w-full">
              <Button className="w-full h-12 text-lg rounded-xl cursor-pointer">
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
        <div className="flex flex-col items-center gap-6">
          <OwlLogo className="w-32 h-32" />
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center justify-center gap-2">
              Ready to practice?
              <Link href="/about">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-8 h-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <Info className="w-5 h-5" />
                </Button>
              </Link>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Hi, {sessionInfo.user.name || sessionInfo.user.email}! Let&apos;s
              write some Kanji.
            </p>
          </div>
        </div>

        <Link href="/write" className="w-full">
          <Button
            size="lg"
            className="w-full h-16 text-xl rounded-2xl shadow-lg hover:scale-105 transition-transform cursor-pointer"
          >
            Start Writing Kanji
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </main>
    </div>
  );
}
