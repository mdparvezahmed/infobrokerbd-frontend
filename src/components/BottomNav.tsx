"use client";

import { Compass, Home, Map, Plus, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "./ui";

const TABS = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/new", label: "Post", icon: Plus, primary: true },
  { href: "/map", label: "Map", icon: Map },
  { href: "/leaderboard", label: "Ranking", icon: Trophy },
];

/** Thumb-friendly navigation for phones, with a raised "Post" button in the middle. */
export function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/new") return null; // the post wizard has its own sticky action bar

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] border-t border-black/5 bg-white/90 pb-safe backdrop-blur-lg md:hidden">
      <div className="mx-auto grid h-16 max-w-md grid-cols-5">
        {TABS.map(({ href, label, icon: Icon, exact, primary }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          if (primary) {
            return (
              <Link key={href} href={href} className="flex flex-col items-center justify-center" aria-label="Share a finding">
                <span className="-mt-6 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-700/30 ring-4 ring-white transition active:scale-95">
                  <Icon className="size-7" strokeWidth={2.5} />
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors",
                active ? "text-brand-700" : "text-stone-500",
              )}
            >
              <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
