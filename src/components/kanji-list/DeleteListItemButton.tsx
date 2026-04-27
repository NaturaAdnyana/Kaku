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
      className="group/btn z-20 flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-base border-2 border-border bg-danger px-3 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-[2px_2px_0_var(--border)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      title="Delete"
      aria-label={`Delete ${character}`}
    >
      <span>Delete</span>
      <Trash2
        size={14}
        className="shrink-0 transition-transform group-hover/btn:scale-110"
      />
    </button>
  );
}
