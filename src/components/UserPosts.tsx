"use client";

import { api } from "@/lib/api";
import { useInfiniteList } from "@/lib/hooks";
import type { Page, PostListItem } from "@/lib/types";
import { PostCard, PostCardSkeleton } from "./PostCard";
import { EmptyState } from "./ui";

export function UserPosts({
  username,
  initial,
  emptyAction,
}: {
  username: string;
  initial?: Page<PostListItem, number>;
  emptyAction?: React.ReactNode;
}) {
  const { observe, ...list } = useInfiniteList<PostListItem, number>(
    (cursor) => api(`/users/${username}/posts`, { query: { cursor: cursor ?? undefined } }),
    [username],
    initial,
  );

  if (!list.loading && list.items.length === 0) {
    return (
      <EmptyState icon="📝" title="No posts yet" action={emptyAction}>
        Findings shared from this account will show up here.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-3">
      {list.items.map((p) => (
        <div key={p.id} className="relative">
          {p.status !== "ACTIVE" && (
            <span className="absolute -top-2 left-3 z-10 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              {p.status === "HIDDEN" ? "Hidden — under review" : "Removed"}
            </span>
          )}
          <PostCard post={p} />
        </div>
      ))}
      {list.loading && Array.from({ length: 3 }, (_, i) => <PostCardSkeleton key={i} />)}
      {!list.done && <div ref={observe} className="h-1" />}
    </div>
  );
}
