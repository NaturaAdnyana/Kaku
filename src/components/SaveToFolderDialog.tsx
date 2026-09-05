"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFolders,
  getWordFolders,
  toggleWordInFolder,
  deleteFolder,
  createFolder,
  updateFolder,
} from "@/app/actions/folder";
import {
  Check,
  Trash2,
  Pencil,
  Plus,
  Loader2,
  FolderPlus,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type FolderItem = {
  id: string;
  name: string;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
};

interface SaveToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  word: string;
}

export function SaveToFolderDialog({
  open,
  onOpenChange,
  word,
}: SaveToFolderDialogProps) {
  const queryClient = useQueryClient();

  // Sub-dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [editFolder, setEditFolder] = useState<{ id: string; name: string } | null>(null);
  const [renameFolderName, setRenameFolderName] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Queries
  const { data: foldersData, isLoading: isLoadingFolders } = useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const res = await getFolders();
      if ("error" in res) throw new Error(res.error);
      return res.data || [];
    },
    enabled: open,
  });

  const { data: wordFoldersData, isLoading: isLoadingWordFolders } = useQuery({
    queryKey: ["word-folders", word],
    queryFn: async () => {
      const res = await getWordFolders(word);
      if ("error" in res) throw new Error(res.error);
      return res.folderIds || [];
    },
    enabled: open,
  });

  // Toggle Mutation with OPTIMISTIC UPDATES (0ms response)
  const toggleMutation = useMutation({
    mutationFn: async ({
      folderId,
      action,
    }: {
      folderId: string;
      action: "add" | "remove";
    }) => {
      const res = await toggleWordInFolder(folderId, word, action);
      if ("error" in res) throw new Error(res.error);
      return res;
    },
    onMutate: async ({ folderId, action }) => {
      await queryClient.cancelQueries({ queryKey: ["word-folders", word] });

      const prevWordFolders =
        queryClient.getQueryData<string[]>(["word-folders", word]) ?? [];
      const nextWordFolders =
        action === "add"
          ? [...prevWordFolders, folderId]
          : prevWordFolders.filter((id) => id !== folderId);

      // Instant optimistic update for checkboxes
      queryClient.setQueryData(["word-folders", word], nextWordFolders);

      // Instant optimistic update for folder item counts
      const prevFolders =
        queryClient.getQueryData<FolderItem[]>(["folders"]) ?? [];
      const nextFolders = prevFolders.map((f) => {
        if (f.id === folderId) {
          const diff = action === "add" ? 1 : -1;
          return {
            ...f,
            itemCount: Math.max(0, (f.itemCount ?? 0) + diff),
          };
        }
        return f;
      });
      queryClient.setQueryData(["folders"], nextFolders);

      return { prevWordFolders, prevFolders };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevWordFolders) {
        queryClient.setQueryData(["word-folders", word], context.prevWordFolders);
      }
      if (context?.prevFolders) {
        queryClient.setQueryData(["folders"], context.prevFolders);
      }
      toast.error("Failed to update folder");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["word-folders", word] });
      void queryClient.invalidateQueries({ queryKey: ["folders"] });
      void queryClient.invalidateQueries({ queryKey: ["kanji-dbData", word] });
    },
  });

  // Create Folder Mutation
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await createFolder(name);
      if ("error" in res) throw new Error(res.error);
      return res.folder;
    },
    onSuccess: (newFolder) => {
      void queryClient.invalidateQueries({ queryKey: ["folders"] });
      setNewFolderName("");
      setIsCreateOpen(false);
      toast.success("Folder created");
      // Automatically add word to newly created folder
      if (newFolder?.id) {
        toggleMutation.mutate({
          folderId: newFolder.id,
          action: "add",
        });
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to create folder");
    },
  });

  // Rename Folder Mutation
  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await updateFolder(id, name);
      if ("error" in res) throw new Error(res.error);
      return res.folder;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["folders"] });
      setRenameFolderName("");
      setEditFolder(null);
      toast.success("Folder renamed");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to rename folder");
    },
  });

  // Delete Folder Mutation
  const deleteMutation = useMutation({
    mutationFn: async (folderId: string) => {
      const res = await deleteFolder(folderId);
      if ("error" in res) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["folders"] });
      void queryClient.invalidateQueries({ queryKey: ["word-folders", word] });
      setDeleteTarget(null);
      toast.success("Folder deleted");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete folder");
    },
  });

  const handleToggle = (folderId: string, isCurrentlyChecked: boolean) => {
    toggleMutation.mutate({
      folderId,
      action: isCurrentlyChecked ? "remove" : "add",
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    createMutation.mutate(newFolderName);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameFolderName.trim() || !editFolder) return;
    renameMutation.mutate({ id: editFolder.id, name: renameFolderName });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  };

  const isLoading = isLoadingFolders || isLoadingWordFolders;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="font-sans max-w-md w-full border-2 border-border bg-blank p-6 rounded-base shadow-shadow">
          {/* Header */}
          <DialogHeader className="gap-1.5 text-left border-b-2 border-border pb-4">
            <DialogTitle className="text-lg font-black uppercase tracking-wider text-foreground">
              Save to Folder
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground flex items-center flex-wrap gap-1.5 font-medium">
              <span>Word:</span>
              <span className="font-jp font-bold text-sm text-foreground bg-secondary px-2 py-0.5 rounded-base border-2 border-border shadow-[2px_2px_0_var(--border)]">
                {word}
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* Folder List */}
          <div className="max-h-[340px] overflow-y-auto pr-1 flex flex-col gap-2.5 py-1">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-main-foreground" />
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Loading Folders...
                </span>
              </div>
            ) : !foldersData || foldersData.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-border rounded-base bg-secondary/30 p-6 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-base bg-secondary border-2 border-border flex items-center justify-center shadow-[2px_2px_0_var(--border)]">
                  <FolderPlus className="w-6 h-6 text-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold text-foreground">No folders yet</p>
                  <p className="text-xs text-muted-foreground">
                    Create your first folder below to organize your kanji.
                  </p>
                </div>
              </div>
            ) : (
              foldersData.map((f) => {
                const isChecked = wordFoldersData?.includes(f.id) || false;
                return (
                  <div
                    key={f.id}
                    onClick={() => handleToggle(f.id, isChecked)}
                    className={cn(
                      "group relative flex items-center justify-between p-3.5 rounded-base border-2 border-border transition-all cursor-pointer select-none",
                      isChecked
                        ? "bg-main/15 shadow-[3px_3px_0_var(--border)] translate-x-[-1px] translate-y-[-1px]"
                        : "bg-blank shadow-[3px_3px_0_var(--border)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    )}
                  >
                    {/* Left: Checkbox & Name */}
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-base border-2 border-border flex items-center justify-center transition-all shrink-0",
                          isChecked
                            ? "bg-main text-main-foreground shadow-[1px_1px_0_var(--border)]"
                            : "bg-blank group-hover:border-foreground/80"
                        )}
                      >
                        {isChecked && <Check size={16} strokeWidth={3.5} />}
                      </div>

                      <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                        <span className="text-sm font-bold text-foreground truncate">
                          {f.name}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-secondary text-muted-foreground border border-border/50 px-2 py-0.5 rounded-base shrink-0">
                          {f.itemCount} {f.itemCount === 1 ? "item" : "items"}
                        </span>
                      </div>
                    </div>

                    {/* Right: Clean secondary actions */}
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setEditFolder({ id: f.id, name: f.name });
                          setRenameFolderName(f.name);
                        }}
                        className="h-8 w-8 rounded-base border border-transparent hover:border-border hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        title="Rename folder"
                        aria-label={`Rename ${f.name}`}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget({ id: f.id, name: f.name });
                        }}
                        className="h-8 w-8 rounded-base border border-transparent hover:border-destructive/40 hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                        title="Delete folder"
                        aria-label={`Delete ${f.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Controls */}
          <DialogFooter className="flex-row items-center gap-3 pt-3 border-t-2 border-border sm:justify-between">
            <Button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex-1 h-11 text-xs font-black uppercase tracking-wide gap-2 bg-main text-main-foreground border-2 border-border shadow-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <Plus size={16} strokeWidth={3} />
              New Folder
            </Button>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              variant="neutral"
              className="h-11 px-6 text-xs font-black uppercase tracking-wide border-2 border-border bg-blank shadow-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sub-Dialog: Create Folder */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="font-sans max-w-sm w-full border-2 border-border bg-blank p-6 rounded-base shadow-shadow">
          <DialogHeader className="gap-1 text-left">
            <DialogTitle className="text-base font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <FolderPlus size={18} />
              New Folder
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Create a folder to group your words and kanji.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. JLPT N3, Verbs, Food"
              disabled={createMutation.isPending}
              autoFocus
              className="h-11 border-2 border-border rounded-base bg-blank shadow-shadow font-medium text-sm focus:ring-2 focus:ring-main"
            />
            <DialogFooter className="flex-row gap-2 sm:justify-end">
              <Button
                type="button"
                variant="neutral"
                onClick={() => setIsCreateOpen(false)}
                disabled={createMutation.isPending}
                className="h-10 text-xs font-black uppercase tracking-wide"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !newFolderName.trim()}
                className="h-10 text-xs font-black uppercase tracking-wide bg-main text-main-foreground border-2 border-border shadow-shadow"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sub-Dialog: Rename Folder */}
      <Dialog
        open={!!editFolder}
        onOpenChange={(open) => {
          if (!open) setEditFolder(null);
        }}
      >
        <DialogContent className="font-sans max-w-sm w-full border-2 border-border bg-blank p-6 rounded-base shadow-shadow">
          <DialogHeader className="gap-1 text-left">
            <DialogTitle className="text-base font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <Folder size={18} />
              Rename Folder
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Enter a new name for this folder.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit} className="space-y-4 pt-2">
            <Input
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              placeholder="Folder Name"
              disabled={renameMutation.isPending}
              autoFocus
              className="h-11 border-2 border-border rounded-base bg-blank shadow-shadow font-medium text-sm focus:ring-2 focus:ring-main"
            />
            <DialogFooter className="flex-row gap-2 sm:justify-end">
              <Button
                type="button"
                variant="neutral"
                onClick={() => setEditFolder(null)}
                disabled={renameMutation.isPending}
                className="h-10 text-xs font-black uppercase tracking-wide"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={renameMutation.isPending || !renameFolderName.trim()}
                className="h-10 text-xs font-black uppercase tracking-wide bg-main text-main-foreground border-2 border-border shadow-shadow"
              >
                {renameMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog: Confirm Delete Folder */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="font-sans max-w-sm w-full border-2 border-border bg-blank p-6 rounded-base shadow-shadow">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-black uppercase tracking-wider text-foreground">
              Delete Folder?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground font-medium leading-relaxed">
              Are you sure you want to delete &quot;
              <strong className="text-foreground">{deleteTarget?.name}</strong>
              &quot;? Words inside this folder will not be deleted from your saved list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-end">
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              className="h-10 text-xs font-black uppercase tracking-wide"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="h-10 text-xs font-black uppercase tracking-wide bg-red-500 hover:bg-red-600 text-white border-2 border-border shadow-shadow"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
