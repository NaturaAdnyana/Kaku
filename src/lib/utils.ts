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
