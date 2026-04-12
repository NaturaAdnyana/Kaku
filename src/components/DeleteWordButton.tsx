"use client";

import { useState } from "react";
import { deleteWord, getKanjiByWord } from "@/app/actions/kanji";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DeleteWordButton({ word }: { word: string }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const { data: dbData, isLoading } = useQuery({
    queryKey: ["kanji-dbData", word],
    queryFn: async () => await getKanjiByWord(word),
  });

  const handleDelete = async () => {
    setLoading(true);
    const res = await deleteWord(word);

    if (res?.success) {
      toast.success(`Deleted "${word}" successfully`);
      // Simulate a tiny delay so the user sees it actually complete
      // Then re-route
      setTimeout(() => {
        setLoading(false);
        setOpen(false);
        router.push("/list");
        router.refresh();
      }, 500);
    } else {
      setLoading(false);
      setOpen(false);
      toast.error("Failed to delete word.");
    }
  };

  if (isLoading || !dbData?.kanji) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            disabled={loading}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
            title="Delete Word"
          />
        }
      >
        {loading ? (
          <Loader2 className="animate-spin" size={24} />
        ) : (
          <Trash2 size={24} />
        )}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete &quot;
            {word}&quot; from your saved list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
