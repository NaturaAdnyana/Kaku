"use client";

import { authClient } from "@/lib/auth-client";
import { HandwritingCanvas } from "@/components/HandwritingCanvas";
import { HandwritingSkeleton } from "@/components/HandwritingSkeleton";

export default function WritePage() {
  const { isPending } = authClient.useSession();

  const loading = isPending;

  return (
    <div className="flex flex-col min-h-dvh bg-zinc-50 dark:bg-black font-sans relative overflow-hidden pb-24">
      <main className="flex-1 w-full max-w-md p-4 mx-auto sm:p-6 lg:max-w-lg">
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
          <h2 className="mb-4 text-2xl font-bold text-center">Handwriting</h2>
          {loading ? <HandwritingSkeleton /> : <HandwritingCanvas />}
        </div>
      </main>
    </div>
  );
}
