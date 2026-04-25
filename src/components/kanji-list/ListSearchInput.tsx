"use client";

import { Search, X } from "lucide-react";

export function ListSearchInput({
  placeholder,
  value,
  onChange,
  onClear,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 mb-4 pt-2 pb-4">
      <div className="group relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-200"
          size={18}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-base border-2 border-border bg-blank py-3 pl-11 pr-11 text-sm text-foreground shadow-shadow outline-none transition-all placeholder:text-muted-foreground focus:translate-x-boxShadowX focus:translate-y-boxShadowY focus:shadow-none focus:ring-4 focus:ring-main"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
