import { ArrowRight, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { HeroSearch } from "@/components/HeroSearch";
import { PostCardSkeleton } from "@/components/PostCard";
import { PostFeed } from "@/components/PostFeed";
import { Avatar } from "@/components/ui";
import { compact } from "@/lib/format";
import { serverApi } from "@/lib/server-api";
import { categoryHref, OG_DEFAULTS, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import type { Category, Leader, PostSearchPage, Stats } from "@/lib/types";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...OG_DEFAULTS, url: "/", title: `${SITE_NAME} — ${SITE_TAGLINE}`, description: SITE_DESCRIPTION },
};

export default function HomePage() {
  return (
    <>
      {/* Static hero — part of the prerendered shell, shows instantly */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white">
        <div className="hero-pattern absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-10 pt-6 sm:pb-14 sm:pt-12 lg:grid-cols-[1fr_380px]">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
              <BdFlag /> By the people, for the people
            </p>
            <h1 className="max-w-2xl text-[28px] font-extrabold leading-[1.15] tracking-tight sm:text-5xl">
              Find the best in Bangladesh — from people who&apos;ve been there.
            </h1>
            <p className="bn mt-3 max-w-xl text-[15px] text-brand-50/90 sm:text-lg">
              সেরা মিস্ত্রি, দোকান আর ঘোরার জায়গার খোঁজ — মানুষের সত্যিকারের অভিজ্ঞতা থেকে।
            </p>
            <div className="mt-6 max-w-2xl">
              <HeroSearch />
          </div>
          <Suspense fallback={<div className="mt-6 h-7" />}>
            <StatsLine />
          </Suspense>
          </div>
          <HeroCards />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <section className="relative z-10 -mt-5 sm:-mt-7">
          <Suspense fallback={<CategoryGridSkeleton />}>
            <CategoryGrid />
          </Suspense>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">Latest findings</h2>
                <p className="text-sm text-stone-500">Fresh reviews, tips and experiences</p>
              </div>
              <Link href="/explore" className="flex items-center gap-1 text-sm font-semibold text-brand-700">
                See all <ArrowRight className="size-4" />
              </Link>
            </div>
            <Suspense fallback={<FeedSkeleton />}>
              <LatestFeed />
            </Suspense>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <ShareCta />
            <Suspense fallback={<div className="h-72 animate-pulse rounded-3xl bg-white shadow-card" />}>
              <TopContributors />
            </Suspense>
          </aside>
        </div>
      </div>
    </>
  );
}

async function StatsLine() {
  const stats = await serverApi<Stats>("/stats");
  if (!stats) return null;
  const items = [
    [stats.posts, "findings"],
    [stats.areas, "areas"],
    [stats.users, "contributors"],
  ] as const;
  return (
    <div className="mt-6 flex gap-6 text-sm">
      {items.map(([n, label]) => (
        <div key={label}>
          <span className="text-xl font-extrabold">{compact(n)}</span>{" "}
          <span className="text-brand-100/80">{label}</span>
        </div>
      ))}
    </div>
  );
}

async function CategoryGrid() {
  const data = await serverApi<{ categories: Category[] }>("/categories");
  const categories = data?.categories ?? [];
  return (
    <div className="grid grid-cols-4 gap-2 rounded-3xl bg-white p-3 shadow-lift sm:grid-cols-5 sm:gap-3 sm:p-4 lg:grid-cols-8">
      {categories.map((c, i) => (
        <Link
          key={c.slug}
          href={categoryHref(c.slug)}
          className={`group flex flex-col items-center gap-1.5 rounded-2xl p-2 text-center transition hover:bg-stone-50 active:scale-95 ${i >= 7 ? "max-sm:hidden" : ""}`}
        >
          <span
            className="grid size-12 place-items-center rounded-2xl text-2xl transition group-hover:scale-110 sm:size-14"
            style={{ background: `${c.color}1a` }}
          >
            {c.icon}
          </span>
          <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-stone-700 sm:text-xs">{c.name}</span>
        </Link>
      ))}
      <Link
        href="/explore"
        className="flex flex-col items-center gap-1.5 rounded-2xl p-2 text-center active:scale-95 sm:hidden"
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-stone-100 text-lg font-bold text-stone-500">+{Math.max(categories.length - 7, 0)}</span>
        <span className="text-[11px] font-semibold leading-tight text-stone-700">More</span>
      </Link>
    </div>
  );
}

function BdFlag() {
  return (
    <svg width="18" height="12" viewBox="0 0 10 6" className="rounded-[2px]" aria-label="Bangladesh">
      <rect width="10" height="6" fill="#006a4e" />
      <circle cx="4.5" cy="3" r="2" fill="#f42a41" />
    </svg>
  );
}

/** Decorative stack of example findings for wide screens. */
function HeroCards() {
  const cards = [
    { icon: "⚡", cat: "Electrician", title: "Jamal bhai fixed our whole wiring in a day", meta: "★ 5.0 · Mirpur 1", rot: "-rotate-3", pos: "" },
    { icon: "📱", cat: "Phone Repair", title: "Honest screen replacement with warranty", meta: "★ 4.8 · 0.6 km away", rot: "rotate-2", pos: "ml-10" },
    { icon: "🧭", cat: "Tour Guide", title: "Local guide for Inani beach — fair price", meta: "★ 5.0 · Cox's Bazar", rot: "-rotate-1", pos: "ml-3" },
  ];
  return (
    <div className="hidden space-y-3 lg:block" aria-hidden>
      {cards.map((c) => (
        <div key={c.title} className={`${c.rot} ${c.pos} w-80 rounded-2xl bg-white/95 p-4 text-ink shadow-lift backdrop-blur`}>
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-2xl">{c.icon}</span>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-stone-500">{c.cat}</div>
              <div className="truncate text-sm font-bold">{c.title}</div>
              <div className="text-xs font-semibold text-amber-600">{c.meta}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-2 rounded-3xl bg-white p-3 shadow-lift sm:grid-cols-5 sm:gap-3 sm:p-4 lg:grid-cols-8">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 p-2">
          <div className="size-12 animate-pulse rounded-2xl bg-stone-100 sm:size-14" />
          <div className="h-3 w-14 animate-pulse rounded bg-stone-100" />
        </div>
      ))}
    </div>
  );
}

async function LatestFeed() {
  const page = await serverApi<PostSearchPage>("/posts?limit=10");
  return <PostFeed query={{ limit: 10 }} initial={page ?? undefined} />;
}

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }, (_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

function ShareCta() {
  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-accent-500 to-accent-600 p-5 text-white shadow-card">
      <div className="text-3xl">🤝</div>
      <h3 className="mt-2 text-lg font-extrabold leading-snug">Know a great electrician? An honest phone shop?</h3>
      <p className="mt-1 text-sm text-white/85">
        Save someone from learning it the hard way. Post with or without an account — it takes a minute.
      </p>
      <Link
        href="/new"
        className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-bold text-accent-600 shadow-sm active:scale-95"
      >
        Share a finding <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

async function TopContributors() {
  const data = await serverApi<{ leaders: Leader[] }>("/leaderboard?period=month&limit=5");
  const leaders = data?.leaders ?? [];
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-extrabold">
          <Trophy className="size-5 text-amber-500" /> Top this month
        </h3>
        <Link href="/leaderboard" className="text-xs font-semibold text-brand-700">
          Full ranking
        </Link>
      </div>
      {leaders.length === 0 ? (
        <p className="text-sm text-stone-500">No contributors yet this month — you could be #1!</p>
      ) : (
        <ol className="space-y-2.5">
          {leaders.map((l, i) => (
            <li key={l.id}>
              <Link href={`/u/${l.username}`} className="flex items-center gap-3 rounded-xl p-1 hover:bg-stone-50">
                <span className="w-5 text-center text-sm font-bold text-stone-400">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
                <Avatar name={l.displayName} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{l.displayName}</span>
                  <span className="block truncate text-xs text-stone-500">
                    {l.posts} posts · {l.helpful} helpful
                  </span>
                </span>
                <span className="text-sm font-extrabold text-brand-700">{l.points}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
