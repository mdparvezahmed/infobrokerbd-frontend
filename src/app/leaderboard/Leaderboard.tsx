"use client";

import { Crown, MessageCircle, PenLine, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Avatar, ButtonLink, cn, EmptyState, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import type { Leader } from "@/lib/types";

type Period = "week" | "month" | "all";
const PERIODS: { key: Period; label: string }[] = [
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
];

interface Points {
  POST: number;
  COMMENT: number;
  HELPFUL_RECEIVED: number;
}

export function Leaderboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("month");
  const [loaded, setLoaded] = useState<{ period: Period; leaders: Leader[]; points: Points } | null>(null);
  const data = loaded?.period === period ? loaded : null;

  useEffect(() => {
    api<{ leaders: Leader[]; points: Points }>("/leaderboard", { query: { period, limit: 50 } })
      .then((r) => setLoaded({ period, ...r }))
      .catch(() => setLoaded({ period, leaders: [], points: { POST: 10, COMMENT: 2, HELPFUL_RECEIVED: 5 } }));
  }, [period]);

  const leaders = data?.leaders ?? [];
  const podium = leaders.slice(0, 3);
  const rest = leaders.slice(3);
  const myIndex = user ? leaders.findIndex((l) => l.id === user.id) : -1;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-5">
      <div className="text-center">
        <div className="text-4xl">🏆</div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Top contributors</h1>
        <p className="mt-1 text-sm text-stone-500">The people saving everyone else from learning things the hard way.</p>
      </div>

      <div className="mx-auto mt-5 flex max-w-sm rounded-2xl bg-white p-1 shadow-card">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={cn(
              "h-10 flex-1 rounded-xl text-sm font-bold transition",
              period === p.key ? "bg-brand-600 text-white shadow-sm" : "text-stone-500 hover:text-ink",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {!data ? (
        <div className="mt-8 space-y-3">
          <Skeleton className="h-44 rounded-3xl" />
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : leaders.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon="🌱" title="No one on the board yet" action={<ButtonLink href="/new">Share a finding</ButtonLink>}>
            Post something useful in this period and you&apos;ll be the first name here.
          </EmptyState>
        </div>
      ) : (
        <>
          {/* Podium: 2nd · 1st · 3rd */}
          <div className="mt-8 grid grid-cols-3 items-end gap-2 sm:gap-4">
            {[podium[1], podium[0], podium[2]].map((l, i) => {
              if (!l) return <div key={i} />;
              const place = l === podium[0] ? 1 : l === podium[1] ? 2 : 3;
              const height = place === 1 ? "h-32" : place === 2 ? "h-24" : "h-20";
              const tone =
                place === 1
                  ? "from-amber-300 to-amber-500"
                  : place === 2
                    ? "from-stone-200 to-stone-400"
                    : "from-orange-200 to-orange-400";
              return (
                <Link key={l.id} href={`/u/${l.username}`} className="group flex flex-col items-center text-center">
                  <div className="relative">
                    {place === 1 && <Crown className="absolute -top-6 left-1/2 size-6 -translate-x-1/2 fill-amber-400 text-amber-500" />}
                    <Avatar name={l.displayName} size={place === 1 ? 72 : 56} className="ring-4 ring-white shadow-card" />
                  </div>
                  <div className="mt-2 line-clamp-1 max-w-full text-sm font-bold group-hover:underline">{l.displayName}</div>
                  <div className="text-xs font-extrabold text-brand-700">{l.points} pts</div>
                  <div
                    className={cn(
                      "mt-2 grid w-full place-items-center rounded-t-2xl bg-gradient-to-b text-3xl font-black text-white/90 shadow-inner",
                      height,
                      tone,
                    )}
                  >
                    {place}
                  </div>
                </Link>
              );
            })}
          </div>

          <ol className="mt-4 space-y-2">
            {rest.map((l, i) => (
              <li key={l.id}>
                <LeaderRow leader={l} rank={i + 4} me={user?.id === l.id} />
              </li>
            ))}
          </ol>

          {user && myIndex === -1 && (
            <p className="mt-4 rounded-2xl bg-white p-4 text-center text-sm text-stone-600 shadow-card">
              You&apos;re not in the top {leaders.length} for this period yet.{" "}
              <Link href="/new" className="font-bold text-brand-700">
                Share a finding
              </Link>{" "}
              to climb!
            </p>
          )}
        </>
      )}

      {/* How points work */}
      <div className="mt-8 rounded-3xl bg-white p-5 shadow-card">
        <h2 className="font-extrabold">How to earn points</h2>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <PointTile icon={<PenLine className="size-5" />} label="Post a finding" points={data?.points.POST ?? 10} />
          <PointTile icon={<ThumbsUp className="size-5" />} label="Someone finds it helpful" points={data?.points.HELPFUL_RECEIVED ?? 5} />
          <PointTile icon={<MessageCircle className="size-5" />} label="Comment" points={data?.points.COMMENT ?? 2} />
        </div>
        <p className="mt-3 text-xs text-stone-500">
          Only logged-in contributions count. Points are taken back if content is removed for breaking the guidelines.
        </p>
      </div>
    </div>
  );
}

function LeaderRow({ leader: l, rank, me }: { leader: Leader; rank: number; me: boolean }) {
  return (
    <Link
      href={`/u/${l.username}`}
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card transition hover:-translate-y-0.5",
        me && "ring-2 ring-brand-500",
      )}
    >
      <span className="w-7 text-center text-sm font-extrabold text-stone-400">{rank}</span>
      <Avatar name={l.displayName} size={40} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">
          {l.displayName} {me && <span className="text-xs text-brand-700">(you)</span>}
        </div>
        <div className="flex gap-3 whitespace-nowrap text-xs text-stone-500">
          <span>{l.posts} posts</span>
          <span>{l.helpful} helpful</span>
          {l.area && <span className="truncate max-sm:hidden">📍 {l.area}</span>}
        </div>
      </div>
      <div className="text-right">
        <div className="font-extrabold text-brand-700">{l.points}</div>
        <div className="text-[10px] font-semibold uppercase text-stone-400">points</div>
      </div>
    </Link>
  );
}

function PointTile({ icon, label, points }: { icon: React.ReactNode; label: string; points: number }) {
  return (
    <div className="rounded-2xl bg-brand-50 p-3">
      <div className="mx-auto grid size-10 place-items-center rounded-xl bg-white text-brand-700 shadow-sm">{icon}</div>
      <div className="mt-2 text-lg font-extrabold text-brand-800">+{points}</div>
      <div className="text-[11px] leading-tight text-stone-600">{label}</div>
    </div>
  );
}
