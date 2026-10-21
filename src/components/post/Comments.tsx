"use client";

import { Flag, MessageCircle, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "@/components/Toaster";
import { Avatar, Button, Input, Spinner, Textarea } from "@/components/ui";
import { api, ApiError, del, post } from "@/lib/api";
import { isBangla, timeAgo } from "@/lib/format";
import { useInfiniteList } from "@/lib/hooks";
import type { Comment, Page } from "@/lib/types";
import { ReportSheet } from "./ReportSheet";

/** Comments: anyone can read, write (with an optional name) and report. `initial` is the server-rendered first page. */
export function Comments({
  postId,
  count,
  closed,
  initial,
}: {
  postId: number;
  count: number;
  closed?: boolean;
  initial?: Page<Comment, number>;
}) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [reportId, setReportId] = useState<number | null>(null);
  const [total, setTotal] = useState(count);

  const { observe, ...list } = useInfiniteList<Comment, number>(
    (cursor) => api(`/posts/${postId}/comments`, { query: { cursor: cursor ?? undefined } }),
    [postId],
    initial,
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 2) return;
    setSending(true);
    try {
      const res = await post<{ comment: Comment }>(`/posts/${postId}/comments`, {
        body: body.trim(),
        authorName: user ? null : name.trim() || null,
      });
      list.setItems((items) => [...items, res.comment]);
      setTotal((t) => t + 1);
      setBody("");
      toast.success(user ? "Comment posted (+2 points)" : "Comment posted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't post your comment");
    } finally {
      setSending(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this comment?")) return;
    try {
      if (user?.role === "ADMIN") await post("/admin/moderate", { targetType: "COMMENT", targetId: id, action: "remove" });
      else await del(`/comments/${id}`);
      list.setItems((items) => items.filter((c) => c.id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't delete the comment");
    }
  }

  return (
    <section id="comments" className="scroll-mt-24">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold">
        <MessageCircle className="size-5 text-brand-600" /> Comments <span className="text-stone-400">{total}</span>
      </h2>

      <div className="space-y-3">
        {list.items.map((c) => {
          const mine = user && c.author?.id === user.id;
          return (
            <div key={c.id} className="flex gap-3">
              <Avatar name={c.authorName} size={34} className={c.isAnonymous ? "opacity-70" : ""} />
              <div className="min-w-0 flex-1">
                <div className="rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 shadow-card">
                  <div className="flex items-baseline gap-2 text-sm">
                    {c.author ? (
                      <Link href={`/u/${c.author.username}`} className="font-bold hover:underline">
                        {c.authorName}
                      </Link>
                    ) : (
                      <span className="font-bold text-stone-600">{c.authorName}</span>
                    )}
                    <span className="text-xs text-stone-400" suppressHydrationWarning>
                      {timeAgo(c.createdAt)}
                    </span>
                  </div>
                  <p
                    lang={isBangla(c.body) ? "bn" : undefined}
                    className={`mt-0.5 whitespace-pre-line break-words text-[15px] text-stone-800 ${isBangla(c.body) ? "bn" : ""}`}>
                    {c.body}
                  </p>
                </div>
                <div className="mt-1 flex gap-3 px-2 text-xs font-semibold text-stone-400">
                  <button onClick={() => setReportId(c.id)} className="flex items-center gap-1 hover:text-accent-600">
                    <Flag className="size-3" /> Report
                  </button>
                  {(mine || user?.role === "ADMIN") && (
                    <button onClick={() => remove(c.id)} className="flex items-center gap-1 hover:text-accent-600">
                      <Trash2 className="size-3" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {list.loading && (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        )}
        {!list.loading && list.items.length === 0 && (
          <p className="rounded-2xl bg-white/60 py-6 text-center text-sm text-stone-500">No comments yet — ask a question or add what you know.</p>
        )}
        {!list.done && <div ref={observe} className="h-1" />}
      </div>

      {closed ? (
        <p className="mt-4 text-sm text-stone-500">Comments are closed on this post.</p>
      ) : (
        <form onSubmit={submit} className="mt-5 rounded-2xl bg-white p-3 shadow-card">
          {!user && (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="Your name (optional — otherwise Anonymous)"
              className="mb-2 h-10 text-sm"
            />
          )}
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            placeholder="Write a comment…"
            className="min-h-20 text-sm"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-stone-400">
              {user ? (
                <>Commenting as {user.displayName}</>
              ) : (
                <>
                  <Link href="/login" className="font-semibold text-brand-700">
                    Log in
                  </Link>{" "}
                  to earn points
                </>
              )}
            </span>
            <Button type="submit" size="sm" loading={sending} disabled={body.trim().length < 2}>
              <Send className="size-4" /> Post
            </Button>
          </div>
        </form>
      )}

      {reportId !== null && (
        <ReportSheet open onClose={() => setReportId(null)} targetType="COMMENT" targetId={reportId} />
      )}
    </section>
  );
}
