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

import { motion, AnimatePresence } from "framer-motion";

interface DeleteWordButtonProps {
  word: string;
  initialDbData?: Awaited<ReturnType<typeof getKanjiByWord>> | null;
}

export function DeleteWordButton({ word, initialDbData }: DeleteWordButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const { data: dbData, isLoading } = useQuery({
    queryKey: ["kanji-dbData", word],
    queryFn: async () => await getKanjiByWord(word),
    initialData: initialDbData ?? undefined,
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

  const isSaved = !isLoading && !!(dbData && "kanji" in dbData && dbData.kanji);

  return (
    <AnimatePresence>
      {isSaved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
        >
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
          <Button
            variant="neutral"
            size="icon"
            disabled={loading}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
            title="Delete Word"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <Trash2 size={24} />
            )}
          </Button>
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}

