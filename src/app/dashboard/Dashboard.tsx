"use client";

import { Award, MessageCircle, PenLine, Plus, Settings, ThumbsUp, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "@/components/Toaster";
import { Avatar, Button, ButtonLink, Field, Input, Sheet, Skeleton, Textarea } from "@/components/ui";
import { UserPosts } from "@/components/UserPosts";
import { api, ApiError, patch } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import type { Page, PostListItem, User } from "@/lib/types";

interface DashboardData {
  user: User;
  rank: number;
  month: { posts: number; comments: number; helpful: number; points: number };
  recentComments: {
    id: number;
    body: string;
    authorName: string;
    authorUsername: string | null;
    createdAt: string;
    post: { id: number; title: string };
  }[];
  posts: Page<PostListItem, number>;
}

export function Dashboard() {
  const { user, loading, setUser } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/dashboard");
      return;
    }
    api<DashboardData>("/me/dashboard")
      .then(setData)
      .catch(() => toast.error("Couldn't load your dashboard"));
  }, [user, loading, router]);

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 pt-5">
        <Skeleton className="h-36 rounded-3xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  const u = data.user;
  return (
    <div className="mx-auto max-w-4xl px-4 pt-5">
      {/* Profile banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white shadow-card sm:p-6">
        <div className="hero-pattern absolute inset-0" />
        <div className="relative flex items-center gap-4">
          <Avatar name={u.displayName} size={64} className="ring-4 ring-white/30" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-extrabold sm:text-2xl">{u.displayName}</h1>
            <p className="text-sm text-brand-100">
              @{u.username}
              {u.area ? ` · ${u.area}` : ""}
            </p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="rounded-xl bg-white/15 p-2.5 ring-1 ring-white/25 hover:bg-white/25"
            aria-label="Edit profile"
          >
            <Settings className="size-5" />
          </button>
        </div>
        <div className="relative mt-5 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-100">Your rank</div>
            <div className="text-4xl font-black">#{data.rank}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-100">Total points</div>
            <div className="text-4xl font-black">{u.reputation}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<PenLine className="size-5" />} label="Posts" value={u.postCount} />
        <Stat icon={<ThumbsUp className="size-5" />} label="Helpful votes" value={u.helpfulReceived} />
        <Stat icon={<MessageCircle className="size-5" />} label="Comments" value={u.commentCount} />
        <Stat icon={<TrendingUp className="size-5" />} label="Points (30 days)" value={data.month.points} highlight />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">My posts</h2>
            <ButtonLink href="/new" size="sm">
              <Plus className="size-4" /> New post
            </ButtonLink>
          </div>
          <UserPosts
            username={u.username}
            initial={data.posts}
            emptyAction={<ButtonLink href="/new">Share your first finding</ButtonLink>}
          />
        </section>

        <aside className="space-y-5">
          <div className="rounded-3xl bg-white p-5 shadow-card">
            <h3 className="mb-3 flex items-center gap-2 font-extrabold">
              <MessageCircle className="size-5 text-brand-600" /> New comments on your posts
            </h3>
            {data.recentComments.length === 0 ? (
              <p className="text-sm text-stone-500">No comments yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.recentComments.map((c) => (
                  <li key={c.id}>
                    <Link href={`/p/${c.post.id}#comments`} className="block rounded-xl p-2 hover:bg-stone-50">
                      <div className="text-xs text-stone-500">
                        <span className="font-semibold text-ink">{c.authorName}</span> on{" "}
                        <span className="font-semibold">{c.post.title}</span> · {timeAgo(c.createdAt)}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-sm text-stone-700">{c.body}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link href="/leaderboard" className="flex items-center gap-3 rounded-3xl bg-amber-50 p-5 ring-1 ring-amber-200 hover:bg-amber-100">
            <Award className="size-8 text-amber-500" />
            <div>
              <div className="font-extrabold text-amber-900">See the ranking</div>
              <div className="text-sm text-amber-800">{data.month.posts} posts and {data.month.helpful} helpful votes this month</div>
            </div>
          </Link>
        </aside>
      </div>

      <EditProfile
        open={editing}
        onClose={() => setEditing(false)}
        user={u}
        onSaved={(nu) => {
          setUser(nu);
          setData((d) => (d ? { ...d, user: nu } : d));
        }}
      />
    </div>
  );
}

function Stat({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 shadow-card ${highlight ? "bg-brand-50 ring-1 ring-brand-200" : "bg-white"}`}>
      <div className={highlight ? "text-brand-700" : "text-stone-400"}>{icon}</div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
      <div className="text-xs font-semibold text-stone-500">{label}</div>
    </div>
  );
}

function EditProfile({ open, onClose, user, onSaved }: { open: boolean; onClose: () => void; user: User; onSaved: (u: User) => void }) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [area, setArea] = useState(user.area ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await patch<{ user: User }>("/me", { displayName, area, bio });
      onSaved(res.user);
      toast.success("Profile updated");
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Edit profile">
      <div className="space-y-4">
        <Field label="Name">
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} />
        </Field>
        <Field label="Area" optional>
          <Input value={area} onChange={(e) => setArea(e.target.value)} maxLength={120} placeholder="e.g. Mirpur, Dhaka" />
        </Field>
        <Field label="About you" optional>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} className="min-h-24" />
        </Field>
        <Button size="lg" className="w-full" loading={saving} onClick={save}>
          Save
        </Button>
      </div>
    </Sheet>
  );
}
