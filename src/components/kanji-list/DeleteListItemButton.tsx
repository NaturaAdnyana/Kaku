"use client";

import { Trash2 } from "lucide-react";

export function DeleteListItemButton({
  character,
  onDelete,
}: {
  character: string;
  onDelete: (event: React.MouseEvent, character: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => onDelete(event, character)}
      className="group/btn z-20 flex h-10 min-w-10 cursor-pointer items-center justify-center gap-2 rounded-base border-2 border-border bg-danger px-3 text-white shadow-[2px_2px_0_var(--border)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[3px] active:translate-y-[3px] sm:w-10 sm:px-0"
      title="Delete"
      aria-label={`Delete ${character}`}
    >
      <span className="text-[10px] font-black uppercase tracking-[0.14em] sm:hidden">
        Delete
      </span>
      <Trash2
        size={15}
        className="shrink-0 transition-transform group-hover/btn:scale-110"
      />
    </button>
  );
}
