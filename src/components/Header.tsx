"use client";

import { LayoutDashboard, LogOut, Plus, Search, Shield, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useIsClient } from "@/lib/hooks";
import { useAuth } from "./AuthProvider";
import { Logo } from "./Logo";
import { Avatar, ButtonLink, cn } from "./ui";

const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/map", label: "Map" },
  { href: "/leaderboard", label: "Ranking" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");

  if (pathname === "/map") return null; // the map is full-screen with its own top bar

  return (
    <header className="sticky top-0 z-[1000] border-b border-black/5 bg-white/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Logo />

        <form
          className="relative ml-4 hidden max-w-sm flex-1 md:block"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/explore${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
          }}
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search shops, services, places…"
            className="h-10 w-full rounded-full bg-stone-100 pl-10 pr-4 text-sm outline-none ring-brand-500 transition focus:bg-white focus:ring-2"
          />
        </form>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                pathname.startsWith(n.href) ? "bg-brand-50 text-brand-700" : "text-stone-600 hover:bg-stone-100",
              )}
            >
              {n.label}
            </Link>
          ))}
          <ButtonLink href="/new" size="sm" className="ml-2">
            <Plus className="size-4" /> Share a finding
          </ButtonLink>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <Link href="/explore" className="rounded-full p-2 text-stone-600 hover:bg-stone-100 md:hidden" aria-label="Search">
            <Search className="size-5" />
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

/** Same header without anything that depends on the URL — prerendered into every page's shell. */
export function HeaderFallback() {
  return (
    <header className="sticky top-0 z-[1000] border-b border-black/5 bg-white/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Logo />
        <div className="ml-4 hidden h-10 max-w-sm flex-1 rounded-full bg-stone-100 md:block" />
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-stone-600">
              {n.label}
            </Link>
          ))}
          <ButtonLink href="/new" size="sm" className="ml-2">
            <Plus className="size-4" /> Share a finding
          </ButtonLink>
        </nav>
        <div className="ml-auto size-9 rounded-full bg-stone-100 md:ml-2" />
      </div>
    </header>
  );
}

function UserMenu() {
  const { user, loading, logout } = useAuth();
  const isClient = useIsClient();
  const pathname = usePathname();
  // Remember which page the menu was opened on — navigating away closes it automatically.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (o: boolean | ((prev: boolean) => boolean)) =>
    setOpenOn((typeof o === "function" ? o(open) : o) ? pathname : null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpenOn(null);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (loading || !isClient) return <div className="size-9 animate-pulse rounded-full bg-stone-200" />;
  if (!user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className="rounded-xl px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
      >
        Log in
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="rounded-full ring-brand-500 focus-visible:ring-2" aria-label="Account menu">
        <Avatar name={user.displayName} size={36} />
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-60 animate-fade-up overflow-hidden rounded-2xl bg-white p-1.5 shadow-lift ring-1 ring-black/5">
          <div className="px-3 py-2.5">
            <div className="truncate font-bold">{user.displayName}</div>
            <div className="text-xs text-stone-500">
              @{user.username} · <span className="font-semibold text-brand-700">{user.reputation} pts</span>
            </div>
          </div>
          <div className="my-1 h-px bg-stone-100" />
          <MenuLink href="/dashboard" icon={<LayoutDashboard className="size-4" />}>
            My dashboard
          </MenuLink>
          <MenuLink href={`/u/${user.username}`} icon={<UserRound className="size-4" />}>
            Public profile
          </MenuLink>
          {user.role === "ADMIN" && (
            <MenuLink href="/admin" icon={<Shield className="size-4" />}>
              Admin panel
            </MenuLink>
          )}
          <button
            onClick={() => void logout()}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            <LogOut className="size-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">
      {icon}
      {children}
    </Link>
  );
}
