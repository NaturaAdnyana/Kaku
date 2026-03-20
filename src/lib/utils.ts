import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSearchCountColor(count: number) {
  if (count < 3) {
    return "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400";
  }
  if (count < 5) {
    return "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400";
  }
  if (count < 10) {
    return "bg-orange-200 dark:bg-orange-800/60 text-orange-800 dark:text-orange-300";
  }
  if (count < 20) {
    return "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400";
  }
  return "bg-red-600 dark:bg-red-700 text-white dark:text-white";
}

export function isKanji(char: string): boolean {
  if (char.length !== 1) return false;
  const code = char.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4dbf) || // CJK Extension A
    (code >= 0x20000 && code <= 0x2a6df) || // CJK Extension B
    (code >= 0x2a700 && code <= 0x2b73f) || // CJK Extension C
    (code >= 0x2b740 && code <= 0x2b81f) || // CJK Extension D
    (code >= 0x2b820 && code <= 0x2ceaf) || // CJK Extension E
    (code >= 0x2ceb0 && code <= 0x2ebef) // CJK Extension F
  );
}
