"use client";

import { LocateFixed, Map as MapIcon, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CategoryChips } from "@/components/CategoryChips";
import { PostFeed } from "@/components/PostFeed";
import { ButtonLink, cn, EmptyState } from "@/components/ui";
import { KIND_ORDER, KINDS } from "@/lib/format";
import { useCategories, useDebounced, useGeolocation } from "@/lib/hooks";
import type { PostKind, SearchMode, SortKey } from "@/lib/types";

const RADII = [1, 3, 5, 10, 25];
const SORT_LABELS: Record<SortKey, string> = {
  relevance: "Best match",
  near: "Nearest",
  new: "Newest",
  top: "Most helpful",
  rating: "Top rated",
};

export function Explorer() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const categories = useCategories();
  const geo = useGeolocation();

  const [q, setQ] = useState(params.get("q") ?? "");
  const category = params.get("category");
  const kind = params.get("kind") as PostKind | null;
  const near = params.get("near") === "1";
  const radius = Number(params.get("r") ?? 5);
  const sortParam = params.get("sort") as SortKey | null;
  const [searchMode, setSearchMode] = useState<SearchMode | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedQ = useDebounced(q.trim(), 350);

  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  // Keep the URL in sync with the (debounced) search box so results are shareable.
  useEffect(() => {
    if ((params.get("q") ?? "") !== debouncedQ) setParams({ q: debouncedQ || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  // "Near me" needs a location fix first.
  useEffect(() => {
    if (near && !geo.coords && geo.status === "idle") void geo.locate();
  }, [near, geo]);

  const sort: SortKey = sortParam ?? (debouncedQ ? "relevance" : near ? "near" : "new");
  const waitingForLocation = near && !geo.coords;

  const query = useMemo(
    () => ({
      q: debouncedQ || undefined,
      category: category ?? undefined,
      kind: kind ?? undefined,
      sort,
      ...(near && geo.coords ? { lat: geo.coords.lat.toFixed(5), lng: geo.coords.lng.toFixed(5), radiusKm: radius } : {}),
      limit: 20,
    }),
    [debouncedQ, category, kind, sort, near, geo.coords, radius],
  );

  const activeCategory = categories.find((c) => c.slug === category);
  const sortOptions: SortKey[] = [
    ...(debouncedQ ? (["relevance"] as const) : []),
    ...(near ? (["near"] as const) : []),
    "new",
    "top",
    "rating",
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-4">
      {/* Search + filters (sticky under the header on mobile) */}
      <div className="sticky top-16 z-20 -mx-4 bg-canvas/95 px-4 pb-3 pt-1 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search in English or বাংলা…"
            className="h-13 w-full rounded-2xl bg-white pl-12 pr-12 text-[15px] shadow-card outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-brand-500"
            enterKeyHint="search"
            autoFocus={!q && !category && !near}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-stone-400 hover:bg-stone-100"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setParams({ near: near ? null : "1", sort: null })}
            className={cn(
              "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold ring-1 transition active:scale-95",
              near ? "bg-accent-500 text-white ring-transparent" : "bg-white text-stone-700 ring-black/10",
            )}
          >
            <LocateFixed className="size-4" />
            {near ? `Within ${radius} km` : "Near me"}
          </button>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={cn(
              "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold ring-1 transition active:scale-95",
              showFilters || kind ? "bg-ink text-white ring-transparent" : "bg-white text-stone-700 ring-black/10",
            )}
          >
            <SlidersHorizontal className="size-4" /> Filters{kind ? " · 1" : ""}
          </button>
          <select
            value={sort}
            onChange={(e) => setParams({ sort: e.target.value })}
            className="ml-auto h-9 rounded-full bg-white px-3 text-sm font-semibold ring-1 ring-black/10 outline-none"
            aria-label="Sort by"
          >
            {sortOptions.map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {showFilters && (
          <div className="mt-3 animate-fade-up space-y-3 rounded-2xl bg-white p-3 shadow-card">
            <div>
              <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-stone-400">Type</div>
              <div className="flex flex-wrap gap-1.5">
                {KIND_ORDER.map((k) => (
                  <button
                    key={k}
                    onClick={() => setParams({ kind: kind === k ? null : k })}
                    className={cn(
                      "h-8 rounded-full px-3 text-sm font-semibold ring-1 transition",
                      kind === k ? "bg-brand-600 text-white ring-transparent" : "bg-white text-stone-700 ring-black/10",
                    )}
                  >
                    {KINDS[k].emoji} {KINDS[k].label}
                  </button>
                ))}
              </div>
            </div>
            {near && (
              <div>
                <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-stone-400">Distance</div>
                <div className="flex flex-wrap gap-1.5">
                  {RADII.map((r) => (
                    <button
                      key={r}
                      onClick={() => setParams({ r: String(r) })}
                      className={cn(
                        "h-8 rounded-full px-3 text-sm font-semibold ring-1",
                        radius === r ? "bg-accent-500 text-white ring-transparent" : "bg-white text-stone-700 ring-black/10",
                      )}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <CategoryChips className="mt-3" categories={categories} value={category} onChange={(slug) => setParams({ category: slug })} />
      </div>

      {/* Context line */}
      <div className="mb-3 mt-1 flex items-center justify-between gap-3 text-sm text-stone-500">
        <h1 className="truncate">
          {activeCategory ? (
            <>
              <span className="font-semibold text-ink">
                {activeCategory.icon} {activeCategory.name}
              </span>{" "}
              <span className="bn">· {activeCategory.nameBn}</span>
            </>
          ) : debouncedQ ? (
            <>
              Results for <span className="font-semibold text-ink">“{debouncedQ}”</span>
            </>
          ) : (
            "Everything people shared across Bangladesh"
          )}
        </h1>
        <Link href="/map" className="flex shrink-0 items-center gap-1 font-semibold text-brand-700">
          <MapIcon className="size-4" /> Map view
        </Link>
      </div>

      {searchMode && searchMode !== "all" && debouncedQ && (
        <div className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
          {searchMode === "fuzzy"
            ? "No exact matches — showing results with similar spelling."
            : "No posts match every word — showing posts that match some of them."}
        </div>
      )}

      {waitingForLocation ? (
        geo.status === "error" ? (
          <EmptyState icon="📍" title="We need your location for “Near me”">
            {geo.error}
          </EmptyState>
        ) : (
          <EmptyState icon="📡" title="Finding your location…">
            Allow location access when your browser asks.
          </EmptyState>
        )
      ) : (
        <PostFeed
          query={query}
          onSearchMode={setSearchMode}
          empty={
            <EmptyState
              icon="🔍"
              title="No findings yet"
              action={<ButtonLink href="/new">Be the first to share</ButtonLink>}
            >
              {near
                ? `Nothing within ${radius} km yet. Try a bigger distance, or share what you know about your area.`
                : "Try different words, or share what you know — it helps the next person."}
            </EmptyState>
          }
        />
      )}
    </div>
  );
}
