"use client";

import { LoginForm } from "@/components/LoginForm";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 overflow-hidden bg-zinc-50 dark:bg-black">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-200/50 dark:bg-zinc-800/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-300/50 dark:bg-zinc-700/20 blur-[120px] animate-pulse delay-700" />
      </div>

      {/* Theme Switcher - Floating */}
      <div className="absolute top-6 right-6 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-2xl w-12 h-12 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-zinc-200 dark:border-zinc-800 shadow-xl transition-all active:scale-90"
        >
          <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      <main className="relative z-10 w-full max-w-md py-12">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-white flex items-center justify-center gap-3">
            MEIKI
          </h1>
          <p className="text-sm font-bold tracking-[0.3em] text-zinc-400 dark:text-zinc-500 uppercase">
            銘記 • Master Your Kanji
          </p>
        </div>
        <LoginForm />
      </main>
    </div>
  );
}
