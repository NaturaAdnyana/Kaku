"use client";

import {
  Dumbbell,
  LogOut,
  PenLine,
  ListCollapse,
  Moon,
  Sun,
  LogIn,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, type CSSProperties } from "react";
import { motion } from "framer-motion";

// ─── Variants (propagate from parent → children) ──────────────────────────────

const containerVariants = {
  rest: {},
  hover: {},
  tap: {},
};

const iconVariants = {
  rest: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.2,
    rotate: -8,
    transition: { type: "spring" as const, stiffness: 450, damping: 18 },
  },
  tap: {
    scale: 0.85,
    rotate: 12,
    transition: { type: "spring" as const, stiffness: 450, damping: 18 },
  },
};

type EaseStr = "easeInOut";
const EASE: EaseStr = "easeInOut";

// Label that slides out on hover
const labelOutVariants = {
  rest: { y: 0, opacity: 1 },
  hover: { y: -10, opacity: 0, transition: { duration: 0.15, ease: EASE } },
};

// Label that slides in on hover
const labelInVariants = {
  rest: { y: 10, opacity: 0 },
  hover: { y: 0, opacity: 1, transition: { duration: 0.15, ease: EASE } },
};

const hoverBgVariants = {
  rest: { opacity: 0, scale: 0.88 },
  hover: { opacity: 1, scale: 1, transition: { duration: 0.18 } },
};

const navBlurMaskStyle: CSSProperties = {
  WebkitMaskImage:
    "linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.1) 22%, rgba(0, 0, 0, 0.5) 56%, black 100%)",
  maskImage:
    "linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.1) 22%, rgba(0, 0, 0, 0.5) 56%, black 100%)",
};

// ─── NavItem ──────────────────────────────────────────────────────────────────

interface NavItemProps {
  isActive?: boolean;
  label: string;
  icon: React.ReactNode;
  className?: string;
}

function NavItem({ isActive, label, icon, className }: NavItemProps) {
  return (
    <motion.div
      className={cn(
        "relative flex h-12 w-full cursor-pointer select-none flex-col items-center justify-center rounded-full sm:h-14",
        className,
      )}
      variants={containerVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
    >
      {/* Active sliding pill */}
      {isActive && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-base bg-main border-2 border-border shadow-[2px_2px_0_var(--border)]"
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
        />
      )}

      {/* Hover glow — non-active only */}
      {!isActive && (
        <motion.span
          className="absolute inset-0 rounded-base bg-secondary"
          variants={hoverBgVariants}
        />
      )}

      {/* Icon */}
      <motion.div
        className="relative flex items-center justify-center"
        variants={iconVariants}
      >
        {icon}
      </motion.div>

      {/* Label — slide-up reveal */}
      {/* motion.div is required here — a plain div breaks Framer Motion's variant propagation */}
      <motion.div className="relative mt-0.5 flex h-3 w-full justify-center overflow-hidden sm:h-[14px]">
        <motion.span
          className="absolute text-[9px] leading-none font-semibold tracking-wide sm:text-[10px]"
          variants={labelOutVariants}
        >
          {label}
        </motion.span>
        <motion.span
          className="absolute text-[9px] leading-none font-bold tracking-widest sm:text-[10px]"
          variants={labelInVariants}
        >
          {label}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

// ─── BottomNav ────────────────────────────────────────────────────────────────

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isPublicPage = ["/", "/about"].includes(pathname);
  if (pathname === "/login") return null;
  if (isPublicPage && !session) return null;

  const isChatRoute = pathname.endsWith("/chat");
  const isLearnRoute = pathname.includes("/learn/");
  if (isChatRoute || isLearnRoute) return null;

  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.push("/login");
    } finally {
      setIsSigningOut(false);
    }
  };

  const baseText = "text-muted-foreground";
  const activeText = "text-main-foreground";

  const themeIcon = (
    <div className="relative flex h-5 w-5 items-center justify-center sm:h-[22px] sm:w-[22px]">
      <Moon
        className="absolute transition-transform scale-100 rotate-0 dark:-rotate-90 dark:scale-0"
        size={20}
      />
      <Sun
        className="absolute transition-transform scale-0 rotate-90 dark:rotate-0 dark:scale-100"
        size={20}
      />
    </div>
  );

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-24 sm:h-28"
      >
        <span
          className="absolute inset-0 bg-gradient-to-b from-transparent via-blank/10 to-blank/80 backdrop-blur-[18px] sm:backdrop-blur-[20px]"
          style={navBlurMaskStyle}
        />
      </div>

      <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-1rem)] max-w-md -translate-x-1/2 items-center gap-2 sm:bottom-6 sm:w-[95%] sm:gap-3">
        <nav className="isolate flex min-w-0 flex-1 items-center justify-around gap-1 overflow-hidden rounded-base border-2 border-border bg-blank p-1.5 shadow-shadow transition-all sm:gap-2 sm:p-2">
          <Link
            href="/list"
            className={cn(
              "flex-1",
              pathname === "/list" ? activeText : baseText,
            )}
          >
            <NavItem
              isActive={pathname === "/list"}
              label="List"
              icon={<ListCollapse size={20} className="sm:size-[22px]" />}
            />
          </Link>

          <Link
            href="/flashcard"
            className={cn(
              "flex-1",
              pathname === "/flashcard" ? activeText : baseText,
            )}
          >
            <NavItem
              isActive={pathname === "/flashcard"}
              label="Train"
              icon={<Dumbbell size={20} className="sm:size-[22px]" />}
            />
          </Link>

          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className={cn("flex-1", baseText)}
          >
            <NavItem label="Theme" icon={themeIcon} />
          </button>

          {session ? (
            <button
              onClick={handleLogout}
              disabled={isSigningOut}
              aria-label="Logout"
              className="flex-1 text-red-400/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <NavItem
                label={isSigningOut ? "..." : "Logout"}
                icon={<LogOut size={20} className="sm:size-[22px]" />}
              />
            </button>
          ) : (
            <Link
              href="/login"
              aria-label="Login"
              className="flex-1 text-blue-600"
            >
              <NavItem
                label="Login"
                icon={<LogIn size={20} className="sm:size-[22px]" />}
              />
            </Link>
          )}
        </nav>

        <Link
          href="/write"
          aria-label="Write"
          className={cn(
            "isolate flex w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-base border-2 border-border bg-blank p-1.5 shadow-shadow transition-all sm:w-[76px] sm:p-2",
            pathname === "/write" ? activeText : baseText,
          )}
        >
          <NavItem
            isActive={pathname === "/write"}
            label="Write"
            icon={<PenLine size={20} className="sm:size-[22px]" />}
          />
        </Link>
      </div>
    </>
  );
}
