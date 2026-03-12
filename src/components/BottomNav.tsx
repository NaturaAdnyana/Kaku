"use client";

import { LogOut, PenLine, ListCollapse, Moon, Sun, LogIn } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session } = authClient.useSession();

  const hiddenRoutes = ["/", "/login", "/about"];
  if (hiddenRoutes.includes(pathname)) return null;

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const navItemClasses = (isActive: boolean = false) =>
    cn(
      "flex flex-col items-center justify-center w-full h-14 rounded-full transition-all duration-200 active:scale-90 cursor-pointer",
      "hover:bg-white/10 dark:hover:bg-black/10",
      isActive
        ? "text-white dark:text-black bg-white/10 dark:bg-black/10 scale-100"
        : "text-zinc-400 dark:text-zinc-500 hover:text-white dark:hover:text-black",
    );

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-sm bg-zinc-900/90 dark:bg-zinc-100/90 backdrop-blur-xl rounded-full shadow-2xl p-2 flex items-center justify-around z-50 transition-all border border-white/10 dark:border-black/5 gap-2">
      <Link href="/write" className={navItemClasses(pathname === "/write")}>
        <PenLine size={24} />
        <span className="text-[10px] font-semibold tracking-wide">Write</span>
      </Link>

      <Link href="/list" className={navItemClasses(pathname === "/list")}>
        <ListCollapse size={24} />
        <span className="text-[10px] font-semibold tracking-wide">List</span>
      </Link>

      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className={navItemClasses()}
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          <Moon
            className="absolute transition-all scale-100 rotate-0 dark:-rotate-90 dark:scale-0"
            size={24}
          />
          <Sun
            className="absolute transition-all scale-0 rotate-90 dark:rotate-0 dark:scale-100"
            size={24}
          />
        </div>
        <span className="text-[10px] font-semibold tracking-wide">Theme</span>
      </button>

      {session ? (
        <button
          onClick={handleLogout}
          className={cn(
            navItemClasses(),
            "text-red-400/80 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/10",
          )}
        >
          <LogOut size={24} />
          <span className="text-[10px] font-semibold tracking-wide">
            Logout
          </span>
        </button>
      ) : (
        <Link
          href="/login"
          className={cn(
            navItemClasses(),
            "text-blue-400/80 hover:text-blue-500 hover:bg-blue-500/10 dark:hover:bg-blue-500/10",
          )}
        >
          <LogIn size={24} />
          <span className="text-[10px] font-semibold tracking-wide">Login</span>
        </Link>
      )}
    </nav>
  );
}
