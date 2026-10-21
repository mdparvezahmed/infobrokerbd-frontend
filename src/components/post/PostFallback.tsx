"use client";

import { useEffect, useState } from "react";
import { ButtonLink, EmptyState, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import type { PostDetail } from "@/lib/types";
import { PostView } from "./PostView";

/**
 * Shown when the public (server-side) fetch found nothing. Authors and admins can still see
 * hidden/removed posts — this retries in the browser with their session cookie.
 */
export function PostFallback({ id }: { id: string }) {
  const [post, setPost] = useState<PostDetail | null | undefined>(undefined);

  useEffect(() => {
    api<{ post: PostDetail }>(`/posts/${id}`)
      .then((r) => setPost(r.post))
      .catch(() => setPost(null));
  }, [id]);

  if (post === undefined) {
    return (
      <div className="grid min-h-[50dvh] place-items-center">
        <Spinner className="size-8" />
      </div>
    );
  }
  if (post === null) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-10">
        <EmptyState icon="🫥" title="This post isn't available" action={<ButtonLink href="/explore">Explore other findings</ButtonLink>}>
          It may have been removed by its author or an admin, or the link is wrong.
        </EmptyState>
      </div>
    );
  }
  return <PostView post={post} />;
}
