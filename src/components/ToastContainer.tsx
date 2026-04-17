"use client";

import React from "react";
import { SearchAnimation } from "./SearchAnimation";
import { useToast } from "./ToastProvider";

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <>
      {toasts.map((toast) => (
        <SearchAnimation
          key={toast.id}
          savePromise={toast.savePromise}
          word={toast.word}
          onComplete={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
}
