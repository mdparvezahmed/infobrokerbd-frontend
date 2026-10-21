import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getLandingPosts, landingQuery } from "@/lib/landing-data";
import { jsonLd } from "@/lib/site";
import { landingJsonLd } from "@/lib/structured-data";
import { PostCard, PostCardSkeleton } from "./PostCard";
import { PostFeed } from "./PostFeed";
import { ButtonLink, EmptyState, Skeleton } from "./ui";

export interface LandingLink {
  href: string;
  label: string;
  icon?: string;
  count?: number;
}

/**
 * Server-rendered landing page for a category, a city, or both ("Best electricians in Dhaka").
 * These are the pages people land on from search, so the heading, intro and first posts
 * are all in the HTML.
 */
export function Landing({
  path,
  title,
  titleBn,
  intro,
  trail,
  filter,
  chipsTitle,
  chips,
  related,
}: {
  path: string;
  title: string;
  titleBn?: string;
  intro: string;
  trail: [string, string][];
  filter: { category?: string; city?: string };
  chipsTitle?: string;
  chips: LandingLink[];
  related?: LandingLink;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <nav aria-label="Breadcrumb" className="mb-3 flex min-w-0 items-center gap-1.5 text-sm text-stone-500">
        {trail.map(([name, href], i) => (
          <span key={href} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <span>/</span>}
            {i < trail.length - 1 ? (
              <Link href={href} className="shrink-0 hover:text-brand-700">
                {name}
              </Link>
            ) : (
              <span className="truncate font-semibold text-ink">{name}</span>
            )}
          </span>
        ))}
      </nav>

      <header className="rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-5 text-white shadow-lift sm:p-8">
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight sm:text-4xl">{title}</h1>
        {titleBn && (
          <p className="bn mt-1 text-lg font-semibold text-brand-50/90" lang="bn">
            {titleBn}
          </p>
        )}
        <p className="mt-3 max-w-2xl text-[15px] text-brand-50/90">{intro}</p>
        {chips.length > 0 && (
          <div className="mt-5">
            {chipsTitle && <div className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-100/80">{chipsTitle}</div>}
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-3.5 text-sm font-semibold ring-1 ring-white/20 transition hover:bg-white/25 active:scale-95"
                >
                  {c.icon} {c.label}
                  {c.count !== undefined && <span className="text-brand-100/80">{c.count}</span>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <Suspense fallback={<FeedSkeleton />}>
            <LandingFeed path={path} title={title} intro={intro} trail={trail} filter={filter} />
          </Suspense>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Suspense fallback={<div className="h-72 animate-pulse rounded-3xl bg-white shadow-card" />}>
            <TopRated filter={filter} />
          </Suspense>
          <div className="rounded-3xl bg-gradient-to-br from-accent-500 to-accent-600 p-5 text-white shadow-card">
            <h2 className="text-lg font-extrabold leading-snug">Know a good one we&apos;re missing?</h2>
            <p className="mt-1 text-sm text-white/85">Share it in a minute — with or without an account.</p>
            <Link
              href="/new"
              className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-bold text-accent-600 shadow-sm active:scale-95"
            >
              Share a finding <ArrowRight className="size-4" />
            </Link>
          </div>
          {related && (
            <Link
              href={related.href}
              className="flex items-center justify-between rounded-2xl bg-white p-4 text-sm font-semibold text-brand-700 shadow-card hover:shadow-lift"
            >
              <span>
                {related.icon} {related.label}
              </span>
              <ArrowRight className="size-4" />
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}

async function LandingFeed({
  path,
  title,
  intro,
  trail,
  filter,
}: {
  path: string;
  title: string;
  intro: string;
  trail: [string, string][];
  filter: { category?: string; city?: string };
}) {
  const page = await getLandingPosts(filter.category, filter.city, "top");
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(landingJsonLd({ name: title, description: intro, path, posts: page?.items ?? [], trail }))}
      />
      <div className="mb-4">
        <h2 className="text-xl font-extrabold tracking-tight">Most helpful</h2>
        <p className="text-sm text-stone-500">Ranked by how many people found them useful</p>
      </div>
      <PostFeed
        query={landingQuery(filter, "top")}
        initial={page ?? undefined}
        empty={
          <EmptyState icon="🔍" title="No findings here yet" action={<ButtonLink href="/new">Be the first to share</ButtonLink>}>
            Share what you know — it saves the next person from learning it the hard way.
          </EmptyState>
        }
      />
    </>
  );
}

async function TopRated({ filter }: { filter: { category?: string; city?: string } }) {
  const page = await getLandingPosts(filter.category, filter.city, "rating");
  const rated = (page?.items ?? []).filter((p) => p.rating).slice(0, 4);
  if (!rated.length) return null;
  return (
    <section>
      <h2 className="mb-3 font-extrabold">⭐ Top rated</h2>
      <div className="space-y-2.5">
        {rated.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </section>
  );
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

export function LandingSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 pt-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-48 rounded-3xl" />
      <Skeleton className="h-28 rounded-2xl lg:w-2/3" />
      <Skeleton className="h-28 rounded-2xl lg:w-2/3" />
    </div>
  );
}
