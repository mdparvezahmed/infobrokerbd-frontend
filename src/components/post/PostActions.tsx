"use client";

import { Flag, Navigation, Share2, ShieldAlert, ThumbsUp, Trash2, Undo2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "@/components/Toaster";
import { cn } from "@/components/ui";
import { api, ApiError, del, post } from "@/lib/api";
import type { ContentStatus, PostViewerState } from "@/lib/types";
import { ReportSheet } from "./ReportSheet";

export function PostActions({
  postId,
  title,
  helpfulCount,
  lat,
  lng,
  status,
}: {
  postId: number;
  title: string;
  helpfulCount: number;
  lat: number;
  lng: number;
  status: ContentStatus;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [fetched, setFetched] = useState<(PostViewerState & { userId: number }) | null>(null);
  const viewer: PostViewerState =
    user && fetched?.userId === user.id ? fetched : { viewerHasVoted: false, canDelete: false, isAdmin: false };
  const setViewer = (fn: (v: PostViewerState) => PostViewerState) =>
    setFetched((f) => (user ? { ...fn(f && f.userId === user.id ? f : viewer), userId: user.id } : f));
  const [count, setCount] = useState(helpfulCount);
  const [voting, setVoting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    api<PostViewerState>(`/posts/${postId}/viewer`)
      .then((v) => setFetched({ ...v, userId: user.id }))
      .catch(() => {});
  }, [user, postId]);

  async function vote() {
    if (!user) {
      toast.error("Log in to mark posts as helpful");
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setVoting(true);
    // Optimistic update
    const was = viewer.viewerHasVoted;
    setViewer((v) => ({ ...v, viewerHasVoted: !was }));
    setCount((c) => c + (was ? -1 : 1));
    try {
      const res = await post<{ voted: boolean; helpfulCount: number }>(`/posts/${postId}/vote`);
      setViewer((v) => ({ ...v, viewerHasVoted: res.voted }));
      setCount(res.helpfulCount);
    } catch (e) {
      setViewer((v) => ({ ...v, viewerHasVoted: was }));
      setCount((c) => c + (was ? 1 : -1));
      toast.error(e instanceof ApiError ? e.message : "Couldn't save your vote");
    } finally {
      setVoting(false);
    }
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  }

  async function remove() {
    if (!confirm(viewer.isAdmin ? "Remove this post for everyone?" : "Delete your post? This can't be undone.")) return;
    try {
      if (viewer.isAdmin) {
        await post("/admin/moderate", { targetType: "POST", targetId: postId, action: "remove" });
      } else {
        await del(`/posts/${postId}`);
      }
      toast.success("Post removed");
      router.push("/");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't remove the post");
    }
  }

  async function restore() {
    try {
      await post("/admin/moderate", { targetType: "POST", targetId: postId, action: "restore" });
      toast.success("Post restored");
      router.refresh();
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't restore the post");
    }
  }

  const btn = "flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition active:scale-95";

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={vote}
          disabled={voting}
          className={cn(
            btn,
            "col-span-2 sm:col-span-1",
            viewer.viewerHasVoted ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-800 hover:bg-brand-100",
          )}
          aria-pressed={viewer.viewerHasVoted}
        >
          <ThumbsUp className={cn("size-[18px]", viewer.viewerHasVoted && "animate-pop fill-white/30")} />
          Helpful · {count}
        </button>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(btn, "col-span-2 bg-white text-stone-700 ring-1 ring-black/10 hover:bg-stone-50 sm:col-span-1")}
        >
          <Navigation className="size-[18px]" /> Directions
        </a>
        <button onClick={share} className={cn(btn, "col-span-2 bg-white text-stone-700 ring-1 ring-black/10 hover:bg-stone-50 sm:col-span-1")}>
          <Share2 className="size-[18px]" /> Share
        </button>
        <button
          onClick={() => setReportOpen(true)}
          className={cn(btn, "col-span-2 bg-white text-stone-500 ring-1 ring-black/10 hover:bg-stone-50 sm:col-span-1")}
        >
          <Flag className="size-[18px]" /> Report
        </button>
      </div>

      {(viewer.canDelete || viewer.isAdmin) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-stone-100 p-2.5 text-sm">
          {viewer.isAdmin && (
            <span className="flex items-center gap-1 px-1 font-semibold text-stone-600">
              <ShieldAlert className="size-4" /> Admin
            </span>
          )}
          {status !== "ACTIVE" && viewer.isAdmin ? (
            <button onClick={restore} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-semibold text-brand-700 shadow-sm">
              <Undo2 className="size-4" /> Restore post
            </button>
          ) : null}
          {status !== "REMOVED" && (
            <button onClick={remove} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-semibold text-accent-600 shadow-sm">
              <Trash2 className="size-4" /> {viewer.isAdmin ? "Remove post" : "Delete my post"}
            </button>
          )}
        </div>
      )}

      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} targetType="POST" targetId={postId} />
    </>
  );
}
