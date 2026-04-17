import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Brain,
  ExternalLink,
  Github,
  Globe,
  PenLine,
  Repeat2,
  Search,
} from "lucide-react";

import { OwlLogo } from "@/components/OwlLogo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const workflow = [
  {
    icon: Search,
    title: "Find What You Need",
    description:
      "Start from the kanji or word you actually met in real life, not from an abstract deck.",
  },
  {
    icon: PenLine,
    title: "Write It Repeatedly",
    description:
      "Handwriting repetition helps the character settle in your memory through movement and shape.",
  },
  {
    icon: Repeat2,
    title: "Return And Reuse",
    description:
      "Come back to saved words, write them again, and keep them alive through repeated exposure.",
  },
] satisfies {
  icon: LucideIcon;
  title: string;
  description: string;
}[];

const principles = [
  "Kanarazu Kaku! is based on a simple belief: kanji becomes easier to remember when you write it several times and meet it again in useful words.",
  "The goal is not perfect calligraphy. The goal is faster recognition, stronger recall, and enough writing practice that unfamiliar kanji starts feeling familiar.",
  "This makes the app more practical than passive memorization alone. You search, you write, and you reuse what matters.",
] as const;

const credits = [
  {
    name: "Jisho.org",
    href: "https://jisho.org",
    description: "word lookup and dictionary references",
  },
  {
    name: "Google Handwriting Recognition",
    href: "",
    description: "handwriting input recognition",
  },
  {
    name: "Gemma 4",
    href: "https://deepmind.google/models/gemma",
    description: "AI-assisted explanations and chat features",
  },
  {
    name: "kanjiapi.dev",
    href: "https://kanjiapi.dev",
    description: "kanji metadata such as readings, grade, and stroke counts",
  },
  {
    name: "animCJK by parsimonhi",
    href: "https://github.com/parsimonhi/animCJK",
    description: "kanji writing animation and stroke-order visuals",
  },
  {
    name: "Owl icon by Molika",
    href: "https://iconscout.com/contributors/molika",
    description: "owl artwork credit",
  },
] as const;

function SectionCard({
  eyebrow,
  title,
  children,
  tone = "blank",
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  tone?: "blank" | "main" | "secondary";
}) {
  const toneClass =
    tone === "main"
      ? "bg-main text-main-foreground"
      : tone === "secondary"
        ? "bg-secondary text-foreground"
        : "bg-blank text-foreground";

  return (
    <section className={cn("rounded-base border-2 border-border p-5 shadow-shadow", toneClass)}>
      <p className="text-[11px] font-black uppercase tracking-[0.24em] opacity-70">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-black uppercase leading-tight">{title}</h2>
      <div className="mt-4 space-y-3 text-sm font-medium leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-dvh px-4 py-6 pb-28 sm:px-6 sm:py-8">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "neutral" }), "gap-2 font-black uppercase")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="hidden rounded-base border-2 border-border bg-main px-3 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-main-foreground shadow-shadow sm:inline-flex">
            Kanarazu Kaku!
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <SectionCard eyebrow="About The App" title="A writing-first way to learn kanji.">
            <div className="grid gap-6 lg:grid-cols-[140px_minmax(0,1fr)] lg:items-center">
              <div className="mx-auto aspect-square w-full max-w-[140px] rounded-base border-2 border-border bg-main p-4 shadow-shadow">
                <OwlLogo className="h-full w-full" />
              </div>

              <div className="space-y-3">
                <p>
                  <strong>Kanarazu Kaku!</strong> means learning kanji through
                  action. The app was inspired by a very practical observation:
                  we tend to remember kanji faster when we write it, repeat it,
                  and use it several times instead of only seeing it once.
                </p>
                <p>
                  This is why the experience focuses on writing practice,
                  repeated contact, and useful vocabulary. It is meant to help
                  unfamiliar characters become something your eyes and your hand
                  both recognize.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard eyebrow="Guiding Idea" title="Recognition improves when your hand participates." tone="main">
            <div className="inline-flex rounded-base border-2 border-border bg-blank p-3 text-foreground shadow-[2px_2px_0_var(--border)]">
              <Brain className="h-5 w-5" />
            </div>
            {principles.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </SectionCard>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {workflow.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className={cn(
                  "rounded-base border-2 border-border p-5 shadow-shadow",
                  index === 1 ? "bg-main text-main-foreground" : "bg-blank text-foreground",
                )}
              >
                <div className="mb-4 inline-flex rounded-base border-2 border-border bg-secondary p-3 text-foreground shadow-[2px_2px_0_var(--border)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black uppercase">{item.title}</h2>
                <p className="mt-2 text-sm font-medium leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionCard eyebrow="What This App Tries To Do" title="Build useful recall, not only recognition." tone="secondary">
            <p>
              Many kanji tools are great for looking things up, but recall often
              breaks down when you have to write from memory. Kanarazu Kaku!
              focuses on that missing step.
            </p>
            <p>
              The point is to shorten the distance between seeing a kanji and
              being able to write or reuse it confidently.
            </p>
          </SectionCard>

          <SectionCard eyebrow="Credits" title="Libraries, APIs, and references used.">
            <ul className="space-y-3">
              {credits.map((credit) => (
                <li key={credit.name} className="rounded-base border-2 border-border bg-secondary p-4 shadow-[2px_2px_0_var(--border)]">
                  {credit.href ? (
                    <a
                      href={credit.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-black uppercase hover:underline"
                    >
                      {credit.name.includes("animCJK") ? (
                        <Github className="h-4 w-4" />
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                      {credit.name}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-black uppercase">
                      <Globe className="h-4 w-4" />
                      {credit.name}
                    </div>
                  )}
                  <p className="mt-2 text-sm font-medium leading-relaxed">
                    {credit.description}
                  </p>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="flex justify-center">
          <a
            href="https://github.com/NaturaAdnyana/Kaku"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "neutral", size: "lg" }), "gap-2 font-black uppercase")}
          >
            <Github className="h-5 w-5" />
            Project Repository
          </a>
        </div>
      </main>
    </div>
  );
}
