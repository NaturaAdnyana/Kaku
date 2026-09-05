"use client";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveToFolderDialog } from "./SaveToFolderDialog";

export function AddToFolderButton({ word }: { word: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="neutral"
        size="icon"
        onClick={() => setOpen(true)}
        className="cursor-pointer hover:bg-main/20"
        title="Save to Folder"
      >
        <FolderPlus size={24} />
      </Button>

      <SaveToFolderDialog
        open={open}
        onOpenChange={setOpen}
        word={word}
      />
    </>
  );
}
