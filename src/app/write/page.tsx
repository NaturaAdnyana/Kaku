"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { HandwritingCanvas } from "@/components/HandwritingCanvas";
import { Loader2 } from "lucide-react";

export default function WritePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await authClient.getSession();
      if (error || !data) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-zinc-50 dark:bg-black">
        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-zinc-50 dark:bg-black font-sans relative overflow-hidden pb-24">
      <main className="flex-1 w-full max-w-md p-4 mx-auto sm:p-6 lg:max-w-lg">
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
          <h2 className="mb-4 text-2xl font-bold text-center">Handwriting</h2>
          <HandwritingCanvas />
        </div>
      </main>
    </div>
  );
}
