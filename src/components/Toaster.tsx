"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

type Toast = { id: number; message: string; tone: "success" | "error" };

let push: ((t: Omit<Toast, "id">) => void) | null = null;

/** Fire-and-forget notifications: toast.success("Saved"), toast.error("Oops"). */
export const toast = {
  success: (message: string) => push?.({ message, tone: "success" }),
  error: (message: string) => push?.({ message, tone: "error" }),
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let id = 0;
    push = (t) => {
      const toast = { ...t, id: ++id };
      setToasts((prev) => [...prev.slice(-2), toast]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== toast.id)), 3500);
    };
    return () => {
      push = null;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[1200] flex flex-col items-center gap-2 px-4 md:bottom-8">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex max-w-md animate-fade-up items-center gap-2.5 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-lift"
        >
          {t.tone === "success" ? (
            <CheckCircle2 className="size-5 shrink-0 text-brand-400" />
          ) : (
            <AlertCircle className="size-5 shrink-0 text-accent-400" />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
