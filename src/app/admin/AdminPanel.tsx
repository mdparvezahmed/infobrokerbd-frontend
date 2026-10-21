"use client";

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ExternalLink,
  FileText,
  Flag,
  History,
  LayoutGrid,
  MessageSquare,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "@/components/Toaster";
import { Avatar, Button, cn, EmptyState, Spinner } from "@/components/ui";
import { api, ApiError, post } from "@/lib/api";
import { REPORT_REASONS, timeAgo } from "@/lib/format";
import { useDebounced, useInfiniteList } from "@/lib/hooks";
import type { Comment, ContentStatus, PostListItem, ReportReason, User } from "@/lib/types";

type Tab = "overview" | "reports" | "posts" | "comments" | "users" | "log";
const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "reports", label: "Reports", icon: Flag },
  { key: "posts", label: "Posts", icon: FileText },
  { key: "comments", label: "Comments", icon: MessageSquare },
  { key: "users", label: "Users", icon: Users },
  { key: "log", label: "Log", icon: History },
];

type Action = "remove" | "restore" | "dismiss";

async function moderate(targetType: "POST" | "COMMENT", targetId: number, action: Action, note?: string) {
  try {
    await post("/admin/moderate", { targetType, targetId, action, note: note || null });
    toast.success(action === "remove" ? "Removed" : action === "restore" ? "Restored" : "Reports dismissed");
    return true;
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : "Action failed");
    return false;
  }
}

export function AdminPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("reports");

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/admin");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-[50dvh] place-items-center">
        <Spinner className="size-8" />
      </div>
    );
  }
  if (user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-lg px-4 pt-10">
        <EmptyState icon="🔒" title="Admins only">
          You don&apos;t have access to this page.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-5">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
        <ShieldCheck className="size-7 text-brand-600" /> Admin
      </h1>
      <div className="scrollbar-none -mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-bold transition",
              tab === key ? "bg-ink text-white" : "bg-white text-stone-600 shadow-card hover:text-ink",
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>
      <div className="mt-5">
        {tab === "overview" && <Overview onOpen={setTab} />}
        {tab === "reports" && <Reports />}
        {tab === "posts" && <PostsAdmin />}
        {tab === "comments" && <CommentsAdmin />}
        {tab === "users" && <UsersAdmin me={user.id} />}
        {tab === "log" && <Log />}
      </div>
    </div>
  );
}

// ── Overview ───────────────────────────────────────────────────
interface OverviewData {
  posts: Record<ContentStatus, number>;
  openReports: number;
  users: number;
  bannedUsers: number;
  comments: number;
  postsThisWeek: number;
  usersThisWeek: number;
}

function Overview({ onOpen }: { onOpen: (t: Tab) => void }) {
  const [d, setD] = useState<OverviewData | null>(null);
  useEffect(() => {
    api<OverviewData>("/admin/overview").then(setD).catch(() => {});
  }, []);
  if (!d) return <Spinner />;
  const tiles = [
    { label: "Open reports", value: d.openReports, tone: d.openReports ? "bg-accent-50 text-accent-600 ring-accent-100" : "", tab: "reports" as Tab },
    { label: "Hidden (auto)", value: d.posts.HIDDEN, tone: d.posts.HIDDEN ? "bg-amber-50 text-amber-700 ring-amber-200" : "", tab: "posts" as Tab },
    { label: "Active posts", value: d.posts.ACTIVE, tab: "posts" as Tab },
    { label: "Removed posts", value: d.posts.REMOVED, tab: "posts" as Tab },
    { label: "Comments", value: d.comments, tab: "comments" as Tab },
    { label: "Users", value: d.users, tab: "users" as Tab },
    { label: "New posts (7d)", value: d.postsThisWeek, tab: "posts" as Tab },
    { label: "New users (7d)", value: d.usersThisWeek, tab: "users" as Tab },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((t) => (
        <button
          key={t.label}
          onClick={() => onOpen(t.tab)}
          className={cn("rounded-2xl bg-white p-4 text-left shadow-card ring-1 ring-transparent transition hover:-translate-y-0.5", t.tone)}
        >
          <div className="text-3xl font-extrabold">{t.value}</div>
          <div className="text-xs font-semibold opacity-70">{t.label}</div>
        </button>
      ))}
    </div>
  );
}

// ── Reports ────────────────────────────────────────────────────
interface ReportGroup {
  targetType: "POST" | "COMMENT";
  targetId: number;
  count: number;
  reasons: ReportReason[];
  details: string[];
  lastReportedAt: string;
  post: PostListItem | null;
  comment: (Comment & { post: { id: number; title: string } }) | null;
}

function Reports() {
  const [status, setStatus] = useState<"OPEN" | "RESOLVED" | "DISMISSED">("OPEN");
  const { observe, ...list } = useInfiniteList<ReportGroup, number>(
    async (page) => {
      const r = await api<{ items: ReportGroup[]; nextPage: number | null }>("/admin/reports", { query: { status, page: page ?? 0 } });
      return { items: r.items, nextCursor: r.nextPage };
    },
    [status],
  );

  const act = async (g: ReportGroup, action: Action) => {
    if (await moderate(g.targetType, g.targetId, action)) {
      list.setItems((items) => items.filter((x) => !(x.targetType === g.targetType && x.targetId === g.targetId)));
    }
  };

  return (
    <div>
      <Segmented
        value={status}
        onChange={setStatus}
        options={[
          ["OPEN", "Open"],
          ["RESOLVED", "Removed"],
          ["DISMISSED", "Dismissed"],
        ]}
      />
      <div className="mt-4 space-y-3">
        {list.items.map((g) => {
          const statusOfTarget = g.post?.status ?? g.comment?.status;
          return (
            <div key={`${g.targetType}-${g.targetId}`} className="rounded-2xl bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-accent-50 px-2 py-0.5 font-bold text-accent-600">
                  <Flag className="mr-1 inline size-3" />
                  {g.count} {g.count === 1 ? "report" : "reports"}
                </span>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 font-semibold text-stone-600">{g.targetType}</span>
                {statusOfTarget && statusOfTarget !== "ACTIVE" && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-800">{statusOfTarget}</span>
                )}
                <span className="ml-auto text-stone-400">{timeAgo(g.lastReportedAt)}</span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {g.reasons.map((r) => (
                  <span key={r} className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">
                    {REPORT_REASONS[r]}
                  </span>
                ))}
              </div>
              {g.details.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {g.details.map((d, i) => (
                    <li key={i} className="border-l-2 border-stone-200 pl-2 text-sm italic text-stone-600">
                      “{d}”
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 rounded-xl bg-stone-50 p-3">
                {g.post ? (
                  <Link href={`/p/${g.post.id}`} target="_blank" className="group block">
                    <div className="flex items-center gap-1 font-bold group-hover:underline">
                      {g.post.title} <ExternalLink className="size-3.5 text-stone-400" />
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-stone-600">{g.post.excerpt}</p>
                    <div className="mt-1 text-xs text-stone-400">
                      by {g.post.authorName} · {g.post.category.name} · {timeAgo(g.post.createdAt)}
                    </div>
                  </Link>
                ) : g.comment ? (
                  <div>
                    <p className="text-sm text-stone-800">“{g.comment.body}”</p>
                    <Link href={`/p/${g.comment.post.id}#comments`} target="_blank" className="mt-1 block text-xs text-stone-400 hover:underline">
                      by {g.comment.authorName} on “{g.comment.post.title}”
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-stone-400">Content no longer exists</p>
                )}
              </div>

              {status === "OPEN" && (
                <div className="mt-3 flex gap-2">
                  <Button variant="danger" size="sm" onClick={() => act(g, "remove")}>
                    <Trash2 className="size-4" /> Remove
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => act(g, "dismiss")}>
                    <CheckCircle2 className="size-4" /> {statusOfTarget === "HIDDEN" ? "Keep & un-hide" : "Dismiss"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        {list.loading && <Spinner />}
        {list.error && <p className="rounded-xl bg-accent-50 p-3 text-sm text-accent-600">{list.error}</p>}
        {!list.loading && list.items.length === 0 && (
          <EmptyState icon="✅" title={status === "OPEN" ? "No open reports" : "Nothing here"}>
            {status === "OPEN" ? "All clear — nice work." : undefined}
          </EmptyState>
        )}
        {!list.done && <div ref={observe} className="h-1" />}
      </div>
    </div>
  );
}

// ── Posts ──────────────────────────────────────────────────────
function PostsAdmin() {
  const [status, setStatus] = useState<"" | ContentStatus>("");
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim(), 350);
  const { observe, ...list } = useInfiniteList<PostListItem, number>(
    (cursor) => api("/admin/posts", { query: { status, q: dq, cursor: cursor ?? undefined } }),
    [status, dq],
  );

  const act = async (p: PostListItem, action: Action) => {
    if (await moderate("POST", p.id, action)) {
      list.setItems((items) => items.map((x) => (x.id === p.id ? { ...x, status: action === "remove" ? "REMOVED" : "ACTIVE" } : x)));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            ["", "All"],
            ["ACTIVE", "Active"],
            ["HIDDEN", "Hidden"],
            ["REMOVED", "Removed"],
          ]}
        />
        <SearchBox value={q} onChange={setQ} placeholder="Title, place or #id" />
      </div>
      <div className="mt-4 space-y-2">
        {list.items.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl text-xl" style={{ background: `${p.category.color}22` }}>
              {p.category.icon}
            </span>
            <div className="min-w-0 flex-1">
              <Link href={`/p/${p.id}`} target="_blank" className="line-clamp-1 font-bold hover:underline">
                <span className="text-stone-400">#{p.id}</span> {p.title}
              </Link>
              <div className="flex flex-wrap gap-x-2 text-xs text-stone-500">
                <StatusBadge status={p.status} />
                <span>{p.authorName}</span>
                <span>{timeAgo(p.createdAt)}</span>
                {!!p.reportCount && <span className="font-semibold text-accent-600">{p.reportCount} reports</span>}
              </div>
            </div>
            {p.status === "REMOVED" ? (
              <IconBtn label="Restore" onClick={() => act(p, "restore")} icon={<RotateCcw className="size-4" />} />
            ) : (
              <>
                {p.status === "HIDDEN" && <IconBtn label="Un-hide" onClick={() => act(p, "restore")} icon={<RotateCcw className="size-4" />} />}
                <IconBtn label="Remove" danger onClick={() => act(p, "remove")} icon={<Trash2 className="size-4" />} />
              </>
            )}
          </div>
        ))}
        {list.loading && <Spinner />}
        {list.error && <p className="rounded-xl bg-accent-50 p-3 text-sm text-accent-600">{list.error}</p>}
        {!list.loading && list.items.length === 0 && <EmptyState icon="📭" title="No posts" />}
        {!list.done && <div ref={observe} className="h-1" />}
      </div>
    </div>
  );
}

// ── Comments ───────────────────────────────────────────────────
type AdminComment = Comment & { post: { id: number; title: string }; reportCount: number };

function CommentsAdmin() {
  const [status, setStatus] = useState<"" | ContentStatus>("");
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim(), 350);
  const { observe, ...list } = useInfiniteList<AdminComment, number>(
    (cursor) => api("/admin/comments", { query: { status, q: dq, cursor: cursor ?? undefined } }),
    [status, dq],
  );

  const act = async (c: AdminComment, action: Action) => {
    if (await moderate("COMMENT", c.id, action)) {
      list.setItems((items) => items.map((x) => (x.id === c.id ? { ...x, status: action === "remove" ? "REMOVED" : "ACTIVE" } : x)));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            ["", "All"],
            ["ACTIVE", "Active"],
            ["HIDDEN", "Hidden"],
            ["REMOVED", "Removed"],
          ]}
        />
        <SearchBox value={q} onChange={setQ} placeholder="Search comments" />
      </div>
      <div className="mt-4 space-y-2">
        {list.items.map((c) => (
          <div key={c.id} className="flex items-start gap-3 rounded-2xl bg-white p-3 shadow-card">
            <Avatar name={c.authorName} size={34} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-stone-800">{c.body}</p>
              <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-stone-500">
                <StatusBadge status={c.status} />
                <span>{c.authorName}</span>
                <Link href={`/p/${c.post.id}#comments`} target="_blank" className="hover:underline">
                  on “{c.post.title}”
                </Link>
                <span>{timeAgo(c.createdAt)}</span>
                {!!c.reportCount && <span className="font-semibold text-accent-600">{c.reportCount} reports</span>}
              </div>
            </div>
            {c.status === "ACTIVE" ? (
              <IconBtn label="Remove" danger onClick={() => act(c, "remove")} icon={<Trash2 className="size-4" />} />
            ) : (
              <IconBtn label="Restore" onClick={() => act(c, "restore")} icon={<RotateCcw className="size-4" />} />
            )}
          </div>
        ))}
        {list.loading && <Spinner />}
        {list.error && <p className="rounded-xl bg-accent-50 p-3 text-sm text-accent-600">{list.error}</p>}
        {!list.loading && list.items.length === 0 && <EmptyState icon="💬" title="No comments" />}
        {!list.done && <div ref={observe} className="h-1" />}
      </div>
    </div>
  );
}

// ── Users ──────────────────────────────────────────────────────
function UsersAdmin({ me }: { me: number }) {
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim(), 350);
  const { observe, ...list } = useInfiniteList<User, number>(
    (cursor) => api("/admin/users", { query: { q: dq, cursor: cursor ?? undefined } }),
    [dq],
  );

  async function setBan(u: User, banned: boolean) {
    if (banned && !confirm(`Ban @${u.username}? They won't be able to post, comment or vote.`)) return;
    try {
      await post(`/admin/users/${u.id}/ban`, { banned });
      list.setItems((items) => items.map((x) => (x.id === u.id ? { ...x, isBanned: banned } : x)));
      toast.success(banned ? "User banned" : "User unbanned");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed");
    }
  }

  async function setRole(u: User, role: "USER" | "ADMIN") {
    if (!confirm(role === "ADMIN" ? `Make @${u.username} an admin?` : `Remove admin rights from @${u.username}?`)) return;
    try {
      await post(`/admin/users/${u.id}/role`, { role });
      list.setItems((items) => items.map((x) => (x.id === u.id ? { ...x, role } : x)));
      toast.success("Role updated");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed");
    }
  }

  return (
    <div>
      <SearchBox value={q} onChange={setQ} placeholder="Username, name or email" />
      <div className="mt-4 space-y-2">
        {list.items.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
            <Avatar name={u.displayName} size={38} />
            <div className="min-w-0 flex-1">
              <Link href={`/u/${u.username}`} target="_blank" className="font-bold hover:underline">
                {u.displayName}
              </Link>{" "}
              {u.role === "ADMIN" && <span className="rounded bg-brand-100 px-1.5 text-[10px] font-bold text-brand-800">ADMIN</span>}
              {u.isBanned && <span className="ml-1 rounded bg-accent-100 px-1.5 text-[10px] font-bold text-accent-600">BANNED</span>}
              <div className="truncate text-xs text-stone-500">
                @{u.username} · {u.email} · {u.reputation} pts · {u.postCount} posts
              </div>
            </div>
            {u.id !== me && (
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={() => setRole(u, u.role === "ADMIN" ? "USER" : "ADMIN")}>
                  {u.role === "ADMIN" ? "Make user" : "Make admin"}
                </Button>
                <Button variant={u.isBanned ? "secondary" : "danger"} size="sm" onClick={() => setBan(u, !u.isBanned)}>
                  <Ban className="size-4" /> {u.isBanned ? "Unban" : "Ban"}
                </Button>
              </div>
            )}
          </div>
        ))}
        {list.loading && <Spinner />}
        {list.error && <p className="rounded-xl bg-accent-50 p-3 text-sm text-accent-600">{list.error}</p>}
        {!list.done && <div ref={observe} className="h-1" />}
      </div>
    </div>
  );
}

// ── Log ────────────────────────────────────────────────────────
interface LogItem {
  id: number;
  action: string;
  targetType: "POST" | "COMMENT" | null;
  targetId: number | null;
  note: string | null;
  createdAt: string;
  admin: { username: string; displayName: string } | null;
}

function Log() {
  const { observe, ...list } = useInfiniteList<LogItem, number>((cursor) => api("/admin/logs", { query: { cursor: cursor ?? undefined } }), []);
  return (
    <div className="space-y-2">
      {list.items.map((l) => (
        <div key={l.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 text-sm shadow-card">
          <AlertTriangle className="size-4 shrink-0 text-stone-400" />
          <div className="min-w-0 flex-1">
            <span className="font-bold">{l.admin?.displayName ?? "Admin"}</span>{" "}
            <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-bold">{l.action}</span>{" "}
            {l.targetType === "POST" && l.targetId ? (
              <Link href={`/p/${l.targetId}`} className="text-brand-700 hover:underline">
                post #{l.targetId}
              </Link>
            ) : l.targetType ? (
              <span>
                {l.targetType.toLowerCase()} #{l.targetId}
              </span>
            ) : l.targetId ? (
              <span>user #{l.targetId}</span>
            ) : null}
            {l.note && <span className="text-stone-500"> — {l.note}</span>}
          </div>
          <span className="shrink-0 text-xs text-stone-400">{timeAgo(l.createdAt)}</span>
        </div>
      ))}
      {list.loading && <Spinner />}
      {list.error && <p className="rounded-xl bg-accent-50 p-3 text-sm text-accent-600">{list.error}</p>}
      {!list.loading && list.items.length === 0 && <EmptyState icon="📜" title="No moderation actions yet" />}
      {!list.done && <div ref={observe} className="h-1" />}
    </div>
  );
}

// ── Small pieces ───────────────────────────────────────────────
function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="inline-flex rounded-xl bg-white p-1 shadow-card">
      {options.map(([v, label]) => (
        <button
          key={v || "all"}
          onClick={() => onChange(v)}
          className={cn("h-8 rounded-lg px-3 text-sm font-semibold", value === v ? "bg-brand-600 text-white" : "text-stone-500")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-48 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl bg-white pl-9 pr-3 text-sm shadow-card outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );
}

function StatusBadge({ status }: { status: ContentStatus }) {
  const tone = status === "ACTIVE" ? "text-brand-700" : status === "HIDDEN" ? "text-amber-700" : "text-accent-600";
  return <span className={cn("font-bold", tone)}>{status.toLowerCase()}</span>;
}

function IconBtn({ label, icon, onClick, danger }: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold ring-1 transition",
        danger ? "text-accent-600 ring-accent-100 hover:bg-accent-50" : "text-brand-700 ring-brand-200 hover:bg-brand-50",
      )}
    >
      {icon} <span className="max-sm:hidden">{label}</span>
    </button>
  );
}
