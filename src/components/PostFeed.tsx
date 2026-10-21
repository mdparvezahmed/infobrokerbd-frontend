"use client";

import { useRef } from "react";
import { api } from "@/lib/api";
import { useInfiniteList } from "@/lib/hooks";
import type { PostListItem, PostSearchPage } from "@/lib/types";
import { PostCard, PostCardSkeleton } from "./PostCard";
import { Button, EmptyState } from "./ui";

export type FeedQuery = Record<string, string | number | undefined>;

/** Infinite list of posts for any /posts query. Optionally starts from server-rendered data. */
export function PostFeed({
  query,
  initial,
  empty,
  onSearchMode,
}: {
  query: FeedQuery;
  initial?: { items: PostListItem[]; nextCursor: string | null };
  empty?: React.ReactNode;
  onSearchMode?: (mode: PostSearchPage["searchMode"]) => void;
}) {
  const key = JSON.stringify(query);
  // The first page decides how loose the search is; later pages must use the same mode.
  const mode = useRef<PostSearchPage["searchMode"]>(null);

  const { items, loading, error, done, observe, loadMore } = useInfiniteList<PostListItem, string>(
    async (cursor) => {
      const page = await api<PostSearchPage>("/posts", {
        query: { ...query, cursor: cursor ?? undefined, mode: cursor && mode.current ? mode.current : undefined },
      });
      if (!cursor) {
        mode.current = page.searchMode;
        onSearchMode?.(page.searchMode);
      }
      return page;
    },
    [key],
    initial,
  );

  if (!loading && !error && items.length === 0) {
    return <>{empty ?? <EmptyState icon="🔎" title="Nothing here yet">Be the first to share something!</EmptyState>}</>;
  }

  return (
    <div className="space-y-3">
      {items.map((p, i) => (
        <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i % 20, 8) * 30}ms` }}>
          <PostCard post={p} priority={i < 3} />
        </div>
      ))}
      {loading && Array.from({ length: items.length ? 2 : 5 }, (_, i) => <PostCardSkeleton key={i} />)}
      {error && (
        <div className="rounded-2xl bg-accent-50 p-4 text-center text-sm text-accent-600">
          {error}{" "}
          <Button variant="ghost" size="sm" onClick={loadMore}>
            Retry
          </Button>
        </div>
      )}
      {!done && <div ref={observe} className="h-1" />}
      {done && items.length > 4 && <p className="py-6 text-center text-sm text-stone-400">You&apos;ve reached the end ✨</p>}
    </div>
  );
}
