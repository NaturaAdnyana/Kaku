"use client";

import React from "react";
import { SearchToast } from "./SearchToast";
import { useToast } from "./ToastProvider";

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <>
      {toasts.map((toast) => (
        <SearchToast
          key={toast.id}
          savePromise={toast.savePromise}
          word={toast.word}
          onComplete={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
}
