"use client";

import type { Category } from "@/lib/types";
import { cn } from "./ui";

/** Horizontally scrolling category filter, sized for thumbs. */
export function CategoryChips({
  categories,
  value,
  onChange,
  allLabel = "All",
  className,
}: {
  categories: Category[];
  value: string | null;
  onChange: (slug: string | null) => void;
  allLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 py-1", className)}>
      <Chip active={!value} onClick={() => onChange(null)}>
        ✨ {allLabel}
      </Chip>
      {categories.map((c) => (
        <Chip key={c.slug} active={value === c.slug} onClick={() => onChange(value === c.slug ? null : c.slug)} color={c.color}>
          {c.icon} {c.name}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 shrink-0 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold ring-1 transition active:scale-95",
        active ? "text-white shadow-sm ring-transparent" : "bg-white text-stone-700 ring-black/10 hover:bg-stone-50",
      )}
      style={active ? { background: color ?? "var(--color-brand-600)" } : undefined}
    >
      {children}
    </button>
  );
}
