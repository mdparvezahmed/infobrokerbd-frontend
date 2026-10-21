import type { Metadata } from "next";
import Link from "next/link";
import { cache, Suspense } from "react";
import { PostCard } from "@/components/PostCard";
import { PostFallback } from "@/components/post/PostFallback";
import { PostView } from "@/components/post/PostView";
import { Skeleton } from "@/components/ui";
import { KINDS, postHref } from "@/lib/format";
import { serverApi } from "@/lib/server-api";
import { jsonLd, OG_DEFAULTS } from "@/lib/site";
import { postJsonLd } from "@/lib/structured-data";
import type { Comment, Page, PostDetail, PostSearchPage } from "@/lib/types";

/** `42-honest-phone-repair` → `42`. The slug after the id is decorative; the canonical URL fixes it. */
const postId = (param: string) => /^(\d+)(?:-|$)/.exec(param)?.[1] ?? null;

// One API call per request, shared by generateMetadata and the page.
const getPost = cache(async (param: string) => {
  const id = postId(param);
  if (!id) return null;
  const data = await serverApi<{ post: PostDetail }>(`/posts/${id}`);
  return data?.post ?? null;
});

/** First page of comments, rendered into the HTML so crawlers see the whole discussion. */
const getComments = cache(async (param: string) => {
  const id = postId(param);
  return id ? serverApi<Page<Comment, number>>(`/posts/${id}/comments`) : null;
});

/** Meta descriptions get cut at ~155 characters; end on a word boundary. */
function summary(text: string, max = 155) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.lastIndexOf(" ", max - 1);
  return `${flat.slice(0, cut > 80 ? cut : max - 1)}…`;
}

export async function generateMetadata({ params }: PageProps<"/p/[id]">): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  // Hidden/removed posts are still shown to their author in the browser, but never indexed.
  if (!post) return { title: "Post not found", robots: { index: false, follow: true } };
  const where = [post.placeName, post.area, post.city].filter(Boolean).join(", ");
  const rating = post.rating ? `★${post.rating}/5 · ` : "";
  const description = summary(`${rating}${KINDS[post.kind].label} in ${post.category.name}${where ? ` — ${where}` : ""}. ${post.body}`);
  const canonical = postHref(post);
  return {
    title: `${post.title}${where ? ` — ${where}` : ""}`,
    description,
    alternates: { canonical },
    openGraph: {
      ...OG_DEFAULTS,
      type: "article",
      url: canonical,
      title: post.title,
      description,
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
      section: post.category.name,
      authors: [post.authorName],
      ...(post.images[0]
        ? { images: [{ url: post.images[0].url, width: post.images[0].width, height: post.images[0].height, alt: post.title }] }
        : {}),
    },
  };
}

export default function PostPage({ params }: PageProps<"/p/[id]">) {
  return (
    <Suspense fallback={<PostSkeleton />}>
      {params.then(({ id }) => (
        <PostContent id={id} />
      ))}
    </Suspense>
  );
}

async function PostContent({ id }: { id: string }) {
  const [post, comments] = await Promise.all([getPost(id), getComments(id)]);
  if (!post) return <PostFallback id={postId(id) ?? id} />;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(postJsonLd(post, comments?.items ?? []))} />
      <PostView
        post={post}
        comments={comments ?? undefined}
        nearby={
          <Suspense fallback={<Skeleton className="h-64 rounded-3xl" />}>
            <Nearby post={post} />
          </Suspense>
        }
      />
    </>
  );
}

async function Nearby({ post }: { post: PostDetail }) {
  const page = await serverApi<PostSearchPage>(
    `/posts?lat=${post.lat}&lng=${post.lng}&radiusKm=15&sort=near&exclude=${post.id}&limit=4`,
  );
  if (!page?.items.length) return null;
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-extrabold">Nearby findings</h2>
        <Link href={`/map?lat=${post.lat}&lng=${post.lng}&z=15`} className="text-xs font-semibold text-brand-700">
          On map
        </Link>
      </div>
      <div className="space-y-2.5">
        {page.items.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </section>
  );
}

function PostSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 pt-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="aspect-[16/9] w-full rounded-3xl lg:w-2/3" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-32 w-full rounded-3xl lg:w-2/3" />
    </div>
  );
}
