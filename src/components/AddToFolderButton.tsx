"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createFolder, updateFolder } from "@/app/actions/folder";
import { FolderSelectorToastContent } from "./FolderSelectorToastContent";
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

export function AddToFolderButton({ word }: { word: string }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFolder, setEditFolder] = useState<{ id: string; name: string } | null>(null);
  
  const [newFolderName, setNewFolderName] = useState("");
  const [renameFolderName, setRenameFolderName] = useState("");

  const queryClient = useQueryClient();

  // Create Folder Mutation
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await createFolder(name);
      if ("error" in res) throw new Error(res.error);
      return res.folder;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["folders"] });
      setNewFolderName("");
      setIsCreateOpen(false);
      toast.success("Folder created successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create folder");
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
      setIsEditOpen(false);
      toast.success("Folder renamed successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to rename folder");
    },
  });

  const handleOpenFolderToast = () => {
    toast.custom(
      (t) => (
        <FolderSelectorToastContent
          toastId={t}
          word={word}
          onCreateNewFolder={() => setIsCreateOpen(true)}
          onEditFolder={(id, name) => {
            setEditFolder({ id, name });
            setRenameFolderName(name);
            setIsEditOpen(true);
          }}
        />
      ),
      { duration: Infinity, position: "top-center" }
    );
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

  return (
    <>
      <Button
        variant="neutral"
        size="icon"
        onClick={handleOpenFolderToast}
        className="cursor-pointer hover:bg-main/20"
        title="Add to Folder"
      >
        <FolderPlus size={24} />
      </Button>

      {/* Create Folder Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="font-sans">
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your words and kanji.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Verbs, JLPT N3, Food Words"
              disabled={createMutation.isPending}
              autoFocus
            />
            <DialogFooter>
              <Button
                type="button"
                variant="neutral"
                onClick={() => setIsCreateOpen(false)}
                disabled={createMutation.isPending}
                className="h-10 text-xs font-black uppercase"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !newFolderName.trim()}
                className="h-10 text-xs font-black uppercase"
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

      {/* Edit Folder Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="font-sans">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>
              Rename this folder to something else.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit} className="space-y-4">
            <Input
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              placeholder="Folder Name"
              disabled={renameMutation.isPending}
              autoFocus
            />
            <DialogFooter>
              <Button
                type="button"
                variant="neutral"
                onClick={() => setIsEditOpen(false)}
                disabled={renameMutation.isPending}
                className="h-10 text-xs font-black uppercase"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={renameMutation.isPending || !renameFolderName.trim()}
                className="h-10 text-xs font-black uppercase"
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
    </>
  );
}
