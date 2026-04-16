"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SearchToast = {
  id: number;
  savePromise?: Promise<unknown>;
  word?: string;
};

interface ToastContextType {
  toasts: SearchToast[];
  triggerSearchAnimation: (
    targetUrl: string,
    savePromise?: Promise<unknown>,
    word?: string,
  ) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const nextIdRef = useRef(1);
  const [toasts, setToasts] = useState<SearchToast[]>([]);

  const triggerSearchAnimation = useCallback(
    (targetUrl: string, savePromise?: Promise<unknown>, word?: string) => {
      setToasts((prev) => [
        ...prev,
        {
          id: nextIdRef.current++,
          savePromise,
          word,
        },
      ]);

      router.push(targetUrl);

      if (savePromise) {
        savePromise.catch(() => {
          console.error("Save failed");
        });
      }
    },
    [router],
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, triggerSearchAnimation, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
