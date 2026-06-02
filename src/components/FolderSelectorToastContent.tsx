"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFolders, getWordFolders, toggleWordInFolder, deleteFolder } from "@/app/actions/folder";
import { Check, Trash2, Pencil, Plus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FolderSelectorToastContentProps {
  toastId: string | number;
  word: string;
  onCreateNewFolder: () => void;
  onEditFolder: (id: string, name: string) => void;
}

export function FolderSelectorToastContent({
  toastId,
  word,
  onCreateNewFolder,
  onEditFolder,
}: FolderSelectorToastContentProps) {
  const queryClient = useQueryClient();

  // Queries
  const { data: foldersData, isLoading: isLoadingFolders } = useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const res = await getFolders();
      if ("error" in res) throw new Error(res.error);
      return res.data || [];
    },
  });

  const { data: wordFoldersData, isLoading: isLoadingWordFolders } = useQuery({
    queryKey: ["word-folders", word],
    queryFn: async () => {
      const res = await getWordFolders(word);
      if ("error" in res) throw new Error(res.error);
      return res.folderIds || [];
    },
  });

  // Toggle Mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ folderId, action }: { folderId: string; action: "add" | "remove" }) => {
      const res = await toggleWordInFolder(folderId, word, action);
      if ("error" in res) throw new Error(res.error);
      return res;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to trigger re-renders
      void queryClient.invalidateQueries({ queryKey: ["word-folders", word] });
      void queryClient.invalidateQueries({ queryKey: ["folders"] });
      void queryClient.invalidateQueries({ queryKey: ["kanji-dbData", word] }); // Also invalidate main word status if needed
      
      const actionName = variables.action === "add" ? "Added to" : "Removed from";
      toast.success(`${actionName} folder successfully`, { id: "folder-toggle-success" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update folder");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (folderId: string) => {
      const res = await deleteFolder(folderId);
      if ("error" in res) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["folders"] });
      void queryClient.invalidateQueries({ queryKey: ["word-folders", word] });
      toast.success("Folder deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete folder");
    },
  });

  const handleToggle = (folderId: string, isCurrentlyChecked: boolean) => {
    toggleMutation.mutate({
      folderId,
      action: isCurrentlyChecked ? "remove" : "add",
    });
  };

  const handleDeleteFolder = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete folder "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const isUpdating = toggleMutation.isPending || deleteMutation.isPending;

  return (
    <div className="w-[340px] border-2 border-border bg-background p-4 rounded-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#FFFFFF] text-foreground flex flex-col gap-3 font-sans relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b-2 border-border">
        <div>
          <h4 className="text-sm font-black uppercase tracking-wider">Save to Folder</h4>
          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Word: &quot;{word}&quot;</p>
        </div>
        <button
          onClick={() => toast.dismiss(toastId)}
          className="p-1 rounded-sm hover:bg-secondary border border-transparent hover:border-border transition-all cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Folders List */}
      <div className="max-h-[190px] overflow-y-auto pr-1 flex flex-col gap-2">
        {isLoadingFolders || isLoadingWordFolders ? (
          <div className="py-6 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loading folders...</span>
          </div>
        ) : !foldersData || foldersData.length === 0 ? (
          <div className="py-6 text-center border-2 border-dashed border-border/40 rounded-base bg-secondary/20">
            <p className="text-xs font-bold text-muted-foreground">No folders yet.</p>
            <p className="text-[10px] text-muted-foreground/80 mt-1">Create one below to start organizing.</p>
          </div>
        ) : (
          foldersData.map((f) => {
            const isChecked = wordFoldersData?.includes(f.id) || false;
            return (
              <div
                key={f.id}
                onClick={() => !isUpdating && handleToggle(f.id, isChecked)}
                className={cn(
                  "flex items-center justify-between p-2 rounded-base border-2 border-border/60 bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer select-none",
                  isChecked && "border-border bg-main/10 hover:bg-main/20"
                )}
              >
                {/* Left Side: Checkbox & Name */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-sm border-2 border-border flex items-center justify-center transition-all shrink-0",
                      isChecked ? "bg-main text-main-foreground" : "bg-blank"
                    )}
                  >
                    {isChecked && <Check size={12} strokeWidth={4} />}
                  </div>
                  <span className="text-xs font-bold truncate">
                    {f.name}
                    <span className="text-[10px] text-muted-foreground font-black ml-1.5 uppercase tracking-wide">
                      ({f.itemCount} {f.itemCount === 1 ? "item" : "items"})
                    </span>
                  </span>
                </div>

                {/* Right Side: Edit / Delete */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onEditFolder(f.id, f.name)}
                    className="p-1 rounded-sm hover:bg-secondary hover:border-border border border-transparent transition-all cursor-pointer text-muted-foreground hover:text-foreground"
                    title="Rename Folder"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteFolder(e, f.id, f.name)}
                    className="p-1 rounded-sm hover:bg-red-50 hover:border-red-200 border border-transparent transition-all cursor-pointer text-red-500 hover:text-red-600 dark:hover:bg-red-950/20"
                    title="Delete Folder"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex gap-2 pt-2 border-t-2 border-border/40">
        <Button
          onClick={onCreateNewFolder}
          className="flex-1 h-9 text-xs font-black uppercase"
          size="sm"
        >
          <Plus size={14} />
          New Folder
        </Button>
        <Button
          onClick={() => toast.dismiss(toastId)}
          variant="neutral"
          className="h-9 text-xs font-black uppercase"
          size="sm"
        >
          Done
        </Button>
      </div>
    </div>
  );
}
