"use client";

import { Loader2, Star, X } from "lucide-react";
import Link from "next/link";
import { forwardRef, useEffect, type ComponentProps, type ReactNode } from "react";
import { colorFor, initials } from "@/lib/format";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ── Button ─────────────────────────────────────────────────────
type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm shadow-brand-900/20 hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300",
  secondary: "bg-brand-50 text-brand-800 hover:bg-brand-100 active:bg-brand-200",
  outline: "bg-white text-ink ring-1 ring-black/10 hover:bg-stone-50 active:bg-stone-100",
  ghost: "text-stone-600 hover:bg-black/5 active:bg-black/10",
  danger: "bg-accent-600 text-white hover:bg-accent-500 disabled:opacity-60",
};
const SIZES = { sm: "h-9 px-3 text-sm gap-1.5", md: "h-11 px-4 text-sm gap-2", lg: "h-13 px-6 text-base gap-2" };

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: keyof typeof SIZES;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-xl font-semibold transition-colors disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
});

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: keyof typeof SIZES;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold transition-colors",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}

// ── Form fields ────────────────────────────────────────────────
const fieldBase =
  "w-full rounded-xl bg-white px-3.5 text-[15px] text-ink ring-1 ring-black/10 placeholder:text-stone-400 outline-none transition focus:ring-2 focus:ring-brand-500";

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(fieldBase, "h-12", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(function Textarea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={cn(fieldBase, "min-h-32 py-3 leading-relaxed", className)} {...props} />;
});

export function Field({
  label,
  hint,
  error,
  optional,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-semibold text-stone-800">
        {label}
        {optional && <span className="text-xs font-normal text-stone-400">optional</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-sm text-accent-600">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-stone-500">{hint}</span>
      ) : null}
    </label>
  );
}

// ── Display ────────────────────────────────────────────────────
export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-bold text-white", className)}
      style={{ width: size, height: size, background: colorFor(name), fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= value ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"}
        />
      ))}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-5 animate-spin text-brand-600", className)} />;
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-white px-6 py-12 text-center shadow-card">
      <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-brand-50 text-3xl">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-sm text-stone-500">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-stone-200/70", className)} />;
}

// ── Sheet: bottom sheet on mobile, centered dialog on desktop ──
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <button className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-label="Close" />
      <div className="relative max-h-[90dvh] w-full animate-fade-up overflow-y-auto rounded-t-3xl bg-white p-5 pb-safe shadow-lift sm:max-w-md sm:rounded-3xl sm:pb-5">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-stone-200 sm:hidden" />
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
