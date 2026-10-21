import { Images, MapPin, MessageCircle, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { formatDistance, isBangla, KINDS, placeLine, postHref, timeAgo } from "@/lib/format";
import type { PostListItem } from "@/lib/types";

/** Feed card. Posts without photos get a category-coloured tile so the feed never looks empty. */
export function PostCard({ post, priority }: { post: PostListItem; priority?: boolean }) {
  const kind = KINDS[post.kind];
  const distance = formatDistance(post.distanceMeters);
  const where = placeLine(post);

  return (
    <Link
      href={postHref(post)}
      className="group flex gap-3.5 rounded-2xl bg-white p-3 shadow-card ring-1 ring-black/[0.03] transition hover:-translate-y-0.5 hover:shadow-lift sm:p-3.5"
    >
      <div className="relative size-24 shrink-0 overflow-hidden rounded-xl sm:size-28">
        {post.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image}
            alt=""
            loading={priority ? "eager" : "lazy"}
            className="size-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="grid size-full place-items-center text-4xl"
            style={{ background: `linear-gradient(135deg, ${post.category.color}22, ${post.category.color}55)` }}
          >
            <span className="drop-shadow-sm">{post.category.icon}</span>
          </div>
        )}
        {post.imageCount > 1 && (
          <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            <Images className="size-3" /> {post.imageCount}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
          <span className={`rounded-full px-2 py-0.5 ring-1 ${kind.tone}`}>
            {kind.emoji} {kind.label}
          </span>
          <span className="truncate text-stone-500">
            {post.category.icon} {post.category.name}
          </span>
        </div>

        <h3
          lang={isBangla(post.title) ? "bn" : undefined}
          className={`line-clamp-2 font-bold leading-snug text-ink group-hover:text-brand-700 ${isBangla(post.title) ? "bn" : ""}`}
        >
          {post.title}
        </h3>

        {(post.placeName || post.rating) && (
          <div className="mt-1 flex items-center gap-2 text-sm">
            {post.rating ? (
              <span className="flex items-center gap-0.5 font-bold text-amber-600">
                ★ {post.rating}.0
              </span>
            ) : null}
            {post.placeName && <span className="truncate font-medium text-stone-700">{post.placeName}</span>}
          </div>
        )}

        <p className={`mt-1 line-clamp-2 text-sm text-stone-500 ${isBangla(post.excerpt) ? "bn" : ""} max-sm:hidden`}>
          {post.excerpt}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-stone-500">
          {(where || distance) && (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="size-3.5 shrink-0 text-accent-500" />
              <span className="truncate">{[distance, where].filter(Boolean).join(" · ")}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <ThumbsUp className="size-3.5" /> {post.helpfulCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="size-3.5" /> {post.commentCount}
          </span>
          <span className="ml-auto truncate" suppressHydrationWarning>
            {post.authorName} · {timeAgo(post.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="flex gap-3.5 rounded-2xl bg-white p-3 shadow-card">
      <div className="size-24 shrink-0 animate-pulse rounded-xl bg-stone-200/70 sm:size-28" />
      <div className="flex flex-1 flex-col gap-2 py-1">
        <div className="h-3 w-24 animate-pulse rounded bg-stone-200/70" />
        <div className="h-4 w-full animate-pulse rounded bg-stone-200/70" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-stone-200/70" />
        <div className="mt-auto h-3 w-1/2 animate-pulse rounded bg-stone-200/70" />
      </div>
    </div>
  );
}
