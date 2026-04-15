"use client";

import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function BackButton({ className }: { className?: string }) {
  const router = useRouter();

  const handleBack = () => {
    // If there is very little session history, they likely landed here directly.
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push("/list");
    }
  };

  return (
    <button
      onClick={handleBack}
      className={cn(
        buttonVariants({ variant: "neutral", size: "icon" }),
        "cursor-pointer",
        className
      )}
      aria-label="Go back"
    >
      <ChevronLeft size={24} />
    </button>
  );
}
