"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, Github, Globe } from "lucide-react";
import Link from "next/link";
import { OwlLogo } from "@/components/OwlLogo";
import { cn } from "@/lib/utils";

const translations = {
  id: {
    title: "Tentang Kaku!",
    description:
      "Kaku! adalah aplikasi pendukung belajar Kanji yang berfokus pada teknik repetisi tulis (handwriting repetition). Terinspirasi dari pengalaman pribadi menghadapi aksara non-familiar di Jepang, Kaku! hadir sebagai solusi praktis untuk menerjemahkan sekaligus menghafal pola visual Kanji dan memperkaya diksi secara efektif.",
    libraries: "Library & API yang digunakan:",
    back: "Kembali",
    repo: "Repositori Projek",
  },
  en: {
    title: "About Kaku!",
    description:
      "Kaku! is a Kanji learning support tool focused on handwriting repetition. Inspired by the challenge of navigating unfamiliar characters in Japan, Kaku! provides a practical solution to instantly translate while effectively memorizing Kanji patterns and expanding vocabulary.",
    libraries: "Libraries & APIs used:",
    back: "Back",
    repo: "Project Repository",
  },
  ja: {
    title: "Kaku!について",
    description:
      "Kaku!は、繰り返し書くことで漢字の定着を図る学習支援ツールです。日本での生活や仕事の中で直面する「読めない漢字」の課題を解決するため、即時の翻訳と書き取りパターンの習得を同時に行えるよう設計されています。語彙力の向上を効率的にサポートします。",
    libraries: "使用されているライブラリとAPI:",
    back: "戻る",
    repo: "プロジェクトリポジトリ",
  },
};

export default function AboutPage() {
  const [lang, setLang] = useState<"id" | "en" | "ja">("id");
  const t = translations[lang];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 py-12 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "mb-4 gap-2 cursor-pointer",
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </Link>

        <div className="flex flex-col items-center text-center space-y-4">
          <OwlLogo className="w-24 h-24" />
          <h1 className="text-4xl font-extrabold tracking-tight">{t.title}</h1>
          <div className="flex gap-2">
            <Button
              variant={lang === "id" ? "default" : "outline"}
              size="sm"
              onClick={() => setLang("id")}
              className="rounded-full cursor-pointer"
            >
              Indo
            </Button>
            <Button
              variant={lang === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => setLang("en")}
              className="rounded-full cursor-pointer"
            >
              EN
            </Button>
            <Button
              variant={lang === "ja" ? "default" : "outline"}
              size="sm"
              onClick={() => setLang("ja")}
              className="rounded-full cursor-pointer"
            >
              JP
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-xl">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
              {t.description}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-xl">{t.libraries}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li>
                <a
                  href="https://jisho.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  Jisho.org API
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>Google Handwriting Recognition</span>
                </div>
              </li>
              <li>
                <a
                  href="https://iconscout.com/contributors/molika"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  Owl Icon by Molika (Iconscout)
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://openrouter.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  AI Chat - OpenRouter AI
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex justify-center mb-24">
          <a
            href="https://github.com/NaturaAdnyana/Kaku"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "gap-2 rounded-xl cursor-pointer",
            )}
          >
            <Github className="w-5 h-5" />
            {t.repo}
          </a>
        </div>
      </div>
    </div>
  );
}
