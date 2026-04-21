"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpenText,
  Info,
  Loader2,
  PenLine,
  Repeat2,
} from "lucide-react";
import { toast } from "sonner";

import { OwlLogo } from "@/components/OwlLogo";
import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const INSTALL_TOAST_ID = "install-app-hint";
const INSTALL_TOAST_SESSION_KEY = "install-app-hint-shown";
const MOBILE_DEVICE_PATTERN = /Android|iPhone|iPad|iPod/i;

function isInstalledDisplayMode() {
  if (typeof window === "undefined") return false;

  const standaloneNavigator = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    standaloneNavigator.standalone === true
  );
}

function shouldShowInstallToast() {
  if (typeof window === "undefined") return false;

  const isCompactTouchDevice =
    navigator.maxTouchPoints > 1 &&
    window.matchMedia("(max-width: 820px)").matches;
  const isMobileBrowser =
    MOBILE_DEVICE_PATTERN.test(navigator.userAgent) || isCompactTouchDevice;

  return isMobileBrowser && !isInstalledDisplayMode();
}

const publicMethod = [
  {
    icon: PenLine,
    title: "Write First",
    description: "Practice by drawing the kanji yourself instead of only recognizing it.",
  },
  {
    icon: Repeat2,
    title: "Repeat With Purpose",
    description: "Meet the same characters several times until the shape becomes familiar.",
  },
  {
    icon: BookOpenText,
    title: "Use In Context",
    description: "Connect each kanji to a real word so recall survives outside drills.",
  },
] satisfies {
  icon: LucideIcon;
  title: string;
  description: string;
}[];

function PlainInfoLink() {
  return (
    <Link
      href="/about"
      className="inline-flex items-center gap-2 rounded-full px-1 py-1 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-main"
    >
      <Info className="h-4 w-4" />
      About
    </Link>
  );
}

function KanjiDecoration({
  kanji,
  className,
  tone = "muted",
}: {
  kanji: string;
  className: string;
  tone?: "muted" | "main";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute select-none font-jp text-7xl font-bold leading-none sm:text-9xl",
        tone === "main" ? "text-main/55 dark:text-main/40" : "text-foreground/20 dark:text-foreground/25",
        className,
      )}
    >
      {kanji}
    </span>
  );
}

function MethodCard({
  icon: Icon,
  title,
  description,
  accent,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  accent?: "main" | "secondary";
}) {
  return (
    <div
      className={cn(
        "h-full min-h-[168px] rounded-base border-2 border-border p-4 shadow-shadow",
        accent === "main" ? "bg-main text-main-foreground" : "bg-secondary text-foreground",
      )}
    >
      <div className="mb-3 inline-flex rounded-base border-2 border-border bg-blank p-2 text-foreground shadow-[2px_2px_0_var(--border)]">
        <Icon className="h-4 w-4" />
      </div>
      <h2 className="text-sm font-black uppercase tracking-[0.18em]">{title}</h2>
      <p className="mt-2 text-sm font-medium leading-relaxed">{description}</p>
    </div>
  );
}

function SidePanel({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-base border-2 border-border bg-blank p-5 shadow-shadow">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-black uppercase leading-tight">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/80">
        {children}
      </div>
    </section>
  );
}

export default function Home() {
  const { data: sessionInfo, isPending: loading } = authClient.useSession();

  useEffect(() => {
    if (loading || !shouldShowInstallToast()) return;
    if (sessionStorage.getItem(INSTALL_TOAST_SESSION_KEY) === "1") return;

    const timer = window.setTimeout(() => {
      sessionStorage.setItem(INSTALL_TOAST_SESSION_KEY, "1");
      toast("Install Kaku on this device", {
        id: INSTALL_TOAST_ID,
        duration: 9000,
        description:
          "Open the browser menu and choose Add to Home Screen or Install App.",
      });
    }, 1200);

    const handleInstalled = () => toast.dismiss(INSTALL_TOAST_ID);

    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [loading]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="flex items-center gap-3 rounded-base border-2 border-border bg-blank px-5 py-4 shadow-shadow">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-bold uppercase tracking-[0.16em]">
            Loading practice board
          </span>
        </div>
      </div>
    );
  }

  const displayName =
    sessionInfo?.user.name ||
    sessionInfo?.user.email?.split("@")[0] ||
    "Writer";

  const isLoggedIn = Boolean(sessionInfo);

  if (isLoggedIn) {
    return (
      <div className="relative min-h-dvh overflow-hidden pb-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-4rem] top-12 h-28 w-28 rotate-[-8deg] rounded-base border-2 border-border bg-main/80 shadow-shadow sm:h-36 sm:w-36" />
          <div className="absolute right-4 top-24 h-20 w-20 rotate-[8deg] rounded-full border-2 border-border bg-secondary shadow-shadow sm:right-14 sm:h-28 sm:w-28" />
          <div className="absolute bottom-20 right-[-2rem] h-24 w-24 rotate-12 rounded-base border-2 border-border bg-main/70 shadow-shadow sm:h-32 sm:w-32" />
          <KanjiDecoration
            kanji="書"
            className="left-4 top-28 -rotate-6 sm:left-14 sm:top-32"
            tone="main"
          />
          <KanjiDecoration
            kanji="字"
            className="bottom-28 right-6 rotate-6 text-5xl sm:bottom-32 sm:right-16"
          />
        </div>

        <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-6 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="inline-flex rounded-base border-2 border-border bg-main px-3 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-main-foreground shadow-[2px_2px_0_var(--border)]">
              Kanarazu Kaku!
            </div>
            <PlainInfoLink />
          </div>

          <div className="mt-5 flex items-stretch gap-4">
            <div className="flex w-[112px] shrink-0 items-center justify-center rounded-base border-2 border-border bg-main p-3 shadow-shadow sm:w-[128px]">
              <OwlLogo className="h-full w-full max-w-[84px] sm:max-w-[96px]" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center space-y-1">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                Ready to practice
              </p>
              <h1 className="text-3xl font-black uppercase leading-none sm:text-4xl">
                {displayName}, start writing.
              </h1>
            </div>
          </div>

          <p className="mt-5 text-sm font-medium leading-relaxed text-foreground/80 sm:text-base">
            Open the writing board and begin. A touch pen or stylus gives a
            better handwriting experience on mobile.
          </p>

          <div className="mt-5 rounded-base border-2 border-border bg-blank p-4 shadow-shadow sm:p-5">
            <div className="flex flex-col gap-3">
              <Button
                asChild
                size="lg"
                className="h-[52px] px-6 text-base font-black uppercase"
              >
                <Link href="/write">
                  Start Writing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Link
                href="/list"
                className={cn(
                  buttonVariants({ variant: "neutral", size: "lg" }),
                  "h-12 px-6 text-base font-black uppercase",
                )}
              >
                Open Word List
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh overflow-hidden pb-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-4rem] top-12 h-28 w-28 rotate-[-8deg] rounded-base border-2 border-border bg-main/80 shadow-shadow sm:h-36 sm:w-36" />
        <div className="absolute right-4 top-24 h-20 w-20 rotate-[8deg] rounded-full border-2 border-border bg-secondary shadow-shadow sm:right-14 sm:h-28 sm:w-28" />
        <div className="absolute bottom-20 right-[-2rem] h-24 w-24 rotate-12 rounded-base border-2 border-border bg-main/70 shadow-shadow sm:h-32 sm:w-32" />
        <KanjiDecoration
          kanji="書"
          className="left-3 top-24 -rotate-6 sm:left-14 sm:top-28"
          tone="main"
        />
        <KanjiDecoration
          kanji="学"
          className="right-6 top-40 rotate-6 text-5xl sm:right-[72px] sm:top-48"
        />
        <KanjiDecoration
          kanji="習"
          className="bottom-24 left-6 -rotate-3 text-5xl sm:bottom-28 sm:left-16"
        />
      </div>

      <main className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr] lg:items-stretch">
          <section className="space-y-5 sm:space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="inline-flex rounded-base border-2 border-border bg-main px-3 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-main-foreground shadow-[2px_2px_0_var(--border)]">
                Kanarazu Kaku!
              </div>
              <PlainInfoLink />
            </div>

            <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[170px_minmax(0,1fr)] lg:gap-6 lg:items-start">
              <div className="mx-auto w-full max-w-[120px] lg:mx-0 lg:max-w-none">
                <div className="aspect-square rounded-base border-2 border-border bg-main p-4 shadow-shadow">
                  <OwlLogo className="h-full w-full" />
                </div>
              </div>

              <div className="space-y-3 text-center lg:text-left">
                <p className="mx-auto inline-flex w-fit rounded-base border-2 border-border bg-secondary px-3 py-2 text-[11px] font-black uppercase tracking-[0.24em] shadow-[2px_2px_0_var(--border)] lg:mx-0">
                  Write. Repeat. Remember.
                </p>
                <h1 className="max-w-3xl text-3xl font-black uppercase leading-none sm:text-5xl">
                  Learn kanji by writing it until it sticks.
                </h1>
                <p className="max-w-2xl text-sm font-medium leading-relaxed text-foreground/80 sm:text-lg lg:max-w-2xl">
                  Kanarazu Kaku! treats kanji like a hands-on habit. Instead of only reading or memorizing shapes, you practice by writing, repeating, and reusing them in real words.
                </p>
              </div>
            </div>

            <div className="rounded-base border-2 border-border bg-blank p-4 shadow-shadow sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 px-6 text-base font-black uppercase">
                  <Link href="/login">
                    Login To Start Writing
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Link
                  href="/about"
                  className={cn(
                    buttonVariants({ variant: "neutral", size: "lg" }),
                    "h-12 px-6 text-base font-black uppercase",
                  )}
                >
                  How It Works
                </Link>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {publicMethod.map((card, index) => (
                <MethodCard
                  key={card.title}
                  icon={card.icon}
                  title={card.title}
                  description={card.description}
                  accent={index === 0 ? "main" : "secondary"}
                />
              ))}
            </div>
          </section>

          <div className="hidden lg:grid gap-6">
            <SidePanel
              eyebrow="Core Idea"
              title="The faster path is active recall."
            >
              <p>
                Writing forces you to notice stroke flow, balance, and mistakes
                in a way passive reading never does.
              </p>
              <p>
                Repetition matters, but repetition with context matters more. A
                kanji becomes useful when your hand and your memory start
                recognizing it together.
              </p>
            </SidePanel>

            <section className="rounded-base border-2 border-border bg-main p-5 text-main-foreground shadow-shadow">
              <p className="text-[11px] font-black uppercase tracking-[0.24em]">
                Practice Loop
              </p>
              <div className="mt-4 space-y-3">
                <div className="rounded-base border-2 border-border bg-blank p-4 text-foreground shadow-[2px_2px_0_var(--border)]">
                  <p className="text-sm font-black uppercase">1. Find a word</p>
                  <p className="mt-1 text-sm font-medium leading-relaxed">
                    Start from a kanji or vocabulary item you actually want to
                    remember.
                  </p>
                </div>
                <div className="rounded-base border-2 border-border bg-blank p-4 text-foreground shadow-[2px_2px_0_var(--border)]">
                  <p className="text-sm font-black uppercase">2. Write it several times</p>
                  <p className="mt-1 text-sm font-medium leading-relaxed">
                    Build recognition through motion, not only visual exposure.
                  </p>
                </div>
                <div className="rounded-base border-2 border-border bg-blank p-4 text-foreground shadow-[2px_2px_0_var(--border)]">
                  <p className="text-sm font-black uppercase">3. Use it again later</p>
                  <p className="mt-1 text-sm font-medium leading-relaxed">
                    Saved words let you come back before the memory gets cold.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
