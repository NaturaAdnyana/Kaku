import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSearchCountColor(count: number) {
  if (count < 3) {
    return "bg-blank text-foreground";
  }
  if (count < 5) {
    return "bg-main text-main-foreground";
  }
  if (count < 10) {
    return "bg-yellow-300 text-black";
  }
  if (count < 20) {
    return "bg-orange-300 text-black";
  }
  return "bg-danger text-white";
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
