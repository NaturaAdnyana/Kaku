"use client";

import { LogOut, PenLine, ListCollapse, Moon, Sun, LogIn } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";
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
        "relative flex flex-col items-center justify-center w-full h-14 rounded-full cursor-pointer select-none",
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
          className="absolute inset-0 rounded-base bg-secondary border-2 border-border shadow-[2px_2px_0_var(--border)]"
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
      <motion.div className="relative overflow-hidden h-[14px] w-full flex justify-center mt-0.5">
        <motion.span
          className="absolute text-[10px] font-semibold tracking-wide leading-none"
          variants={labelOutVariants}
        >
          {label}
        </motion.span>
        <motion.span
          className="absolute text-[10px] font-bold tracking-widest leading-none"
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
    <div className="relative w-[22px] h-[22px] flex items-center justify-center">
      <Moon
        className="absolute transition-transform scale-100 rotate-0 dark:-rotate-90 dark:scale-0"
        size={22}
      />
      <Sun
        className="absolute transition-transform scale-0 rotate-90 dark:rotate-0 dark:scale-100"
        size={22}
      />
    </div>
  );

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-sm bg-blank rounded-base shadow-shadow p-2 flex items-center justify-around z-50 border-2 border-border gap-2 transition-all">
      <Link
        href="/write"
        className={cn("flex-1", pathname === "/write" ? activeText : baseText)}
      >
        <NavItem
          isActive={pathname === "/write"}
          label="Write"
          icon={<PenLine size={22} />}
        />
      </Link>

      <Link
        href="/list"
        className={cn("flex-1", pathname === "/list" ? activeText : baseText)}
      >
        <NavItem
          isActive={pathname === "/list"}
          label="List"
          icon={<ListCollapse size={22} />}
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
          className="flex-1 text-red-400/80 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <NavItem
            label={isSigningOut ? "..." : "Logout"}
            icon={<LogOut size={22} />}
          />
        </button>
      ) : (
        <Link href="/login" aria-label="Login" className="flex-1 text-blue-600">
          <NavItem label="Login" icon={<LogIn size={22} />} />
        </Link>
      )}
    </nav>
  );
}
