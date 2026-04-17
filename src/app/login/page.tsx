"use client";

import Link from "next/link";
import { Info, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { LoginForm } from "@/components/LoginForm";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative min-h-dvh overflow-hidden px-4 py-4 sm:px-6 sm:py-5">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-3rem] top-7 h-24 w-24 rotate-[-8deg] rounded-base border-2 border-border bg-main/80 shadow-shadow sm:h-32 sm:w-32" />
        <div className="absolute right-4 top-20 h-16 w-16 rotate-[10deg] rounded-full border-2 border-border bg-secondary shadow-shadow sm:h-20 sm:w-20" />
        <div className="absolute bottom-10 right-[-2rem] h-20 w-20 rotate-12 rounded-base border-2 border-border bg-main/70 shadow-shadow sm:h-28 sm:w-28" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md items-center justify-center">
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full px-1 py-1 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-main"
            >
              <Info className="h-4 w-4" />
              About
            </Link>

            <Button
              variant="neutral"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-11 w-11 rounded-2xl bg-white/70 backdrop-blur-md dark:bg-zinc-900/70"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>

          <LoginForm />
        </div>
      </main>
    </div>
  );
}
