import { CalendarDays, Eye, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { Avatar, Stars } from "@/components/ui";
import { formatDate, isBangla, KINDS } from "@/lib/format";
import { categoryHref } from "@/lib/site";
import type { Comment, Page, PostDetail } from "@/lib/types";
import { Comments } from "./Comments";
import { Gallery } from "./Gallery";
import { MiniMapLoader } from "./MiniMapLoader";
import { PostActions } from "./PostActions";

/** Full post layout. Rendered on the server for public posts, and in the browser for authors/admins viewing hidden ones. */
export function PostView({
  post,
  nearby,
  comments,
}: {
  post: PostDetail;
  nearby?: React.ReactNode;
  comments?: Page<Comment, number>;
}) {
  const kind = KINDS[post.kind];
  const bnTitle = isBangla(post.title);
  const bnBody = isBangla(post.body);

  return (
    <article className="mx-auto max-w-5xl px-4 pt-4">
      {post.status !== "ACTIVE" && (
        <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 ring-1 ring-amber-200">
          {post.status === "HIDDEN"
            ? "This post is hidden after several reports and is waiting for admin review. Only you and admins can see it."
            : "This post was removed. Only you and admins can see it."}
        </div>
      )}

      <nav aria-label="Breadcrumb" className="mb-3 flex min-w-0 items-center gap-1.5 text-sm text-stone-500">
        <Link href="/explore" className="hover:text-brand-700">
          Explore
        </Link>
        <span>/</span>
        <Link href={categoryHref(post.category.slug)} className="shrink-0 font-semibold hover:text-brand-700">
          {post.category.icon} {post.category.name}
        </Link>
        {post.city && (
          <>
            <span>/</span>
            <Link href={categoryHref(post.category.slug, post.city)} className="truncate hover:text-brand-700">
              {post.city}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-5">
          <Gallery images={post.images} title={post.title} />

          <header>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className={`rounded-full px-2.5 py-1 ring-1 ${kind.tone}`}>
                {kind.emoji} {kind.label}
              </span>
              <span className="rounded-full px-2.5 py-1 text-white" style={{ background: post.category.color }}>
                {post.category.icon} {post.category.name}
              </span>
            </div>
            <h1
              lang={bnTitle ? "bn" : undefined}
              className={`text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl ${bnTitle ? "bn" : ""}`}
            >
              {post.title}
            </h1>
            {(post.placeName || post.rating) && (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {post.placeName && <span className="text-lg font-bold text-brand-800">{post.placeName}</span>}
                {post.rating && (
                  <span className="flex items-center gap-1.5">
                    <Stars value={post.rating} size={18} />
                    <span className="font-bold text-amber-600">{post.rating}.0</span>
                  </span>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <Avatar name={post.authorName} size={40} />
              <div className="min-w-0 text-sm">
                {post.author ? (
                  <Link href={`/u/${post.author.username}`} className="font-bold hover:underline">
                    {post.authorName}
                  </Link>
                ) : (
                  <span className="font-bold">
                    {post.authorName} <span className="font-normal text-stone-400">(anonymous)</span>
                  </span>
                )}
                {post.author && <span className="ml-2 text-xs font-semibold text-brand-700">{post.author.reputation} pts</span>}
                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3.5" /> {formatDate(post.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="size-3.5" /> {post.viewCount} {post.viewCount === 1 ? "view" : "views"}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <PostActions
            postId={post.id}
            title={post.title}
            helpfulCount={post.helpfulCount}
            lat={post.lat}
            lng={post.lng}
            status={post.status}
          />

          <div
            lang={bnBody ? "bn" : undefined}
            className={`whitespace-pre-line break-words rounded-3xl bg-white p-5 text-[16px] leading-relaxed text-stone-800 shadow-card sm:p-6 ${bnBody ? "bn" : ""}`}
          >
            {post.body}
          </div>

          <div className="lg:hidden">
            <InfoCard post={post} />
          </div>

          <Comments postId={post.id} count={post.commentCount} closed={post.status !== "ACTIVE"} initial={comments} />
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="hidden lg:block">
            <InfoCard post={post} />
          </div>
          {nearby}
        </aside>
      </div>
    </article>
  );
}

function InfoCard({ post }: { post: PostDetail }) {
  const where = [post.address, post.area, post.city].filter(Boolean).join(", ");
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-card">
      <Link href={`/map?lat=${post.lat}&lng=${post.lng}&z=16`} className="block h-44 bg-stone-100" aria-label="Open in map">
        <MiniMapLoader lat={post.lat} lng={post.lng} icon={post.category.icon} color={post.category.color} />
      </Link>
      <div className="space-y-3 p-4 text-sm">
        {post.placeName && <div className="text-base font-bold">{post.placeName}</div>}
        {where && (
          <div className="flex gap-2.5">
            <MapPin className="mt-0.5 size-4 shrink-0 text-accent-500" />
            <span>{where}</span>
          </div>
        )}
        {post.phone && (
          <a href={`tel:${post.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2.5 font-semibold text-brand-700">
            <Phone className="size-4 shrink-0" />
            {post.phone}
          </a>
        )}
        <Link
          href={`/map?lat=${post.lat}&lng=${post.lng}&z=16`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-brand-700"
        >
          See what else is around here →
        </Link>
      </div>
    </div>
  );
}
