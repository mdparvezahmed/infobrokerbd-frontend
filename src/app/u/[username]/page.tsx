import { CalendarDays, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { cache, Suspense } from "react";
import { Avatar, ButtonLink, EmptyState, Skeleton } from "@/components/ui";
import { UserPosts } from "@/components/UserPosts";
import { formatDate } from "@/lib/format";
import { serverApi } from "@/lib/server-api";
import { OG_DEFAULTS } from "@/lib/site";
import type { User } from "@/lib/types";

// One API call per request, shared by generateMetadata and the page.
const getProfile = cache((username: string) => serverApi<{ user: User; rank: number }>(`/users/${encodeURIComponent(username)}`));

export async function generateMetadata({ params }: PageProps<"/u/[username]">): Promise<Metadata> {
  const { username } = await params;
  const data = await getProfile(decodeURIComponent(username));
  if (!data) return { title: `@${username}`, robots: { index: false, follow: true } };
  const { user: u } = data;
  const description =
    u.bio?.slice(0, 155) ??
    `${u.displayName} has shared ${u.postCount} ${u.postCount === 1 ? "finding" : "findings"} about shops, services and places${u.area ? ` around ${u.area}` : " in Bangladesh"} on InfoBrokerBD.`;
  const canonical = `/u/${u.username}`;
  return {
    title: `${u.displayName} (@${u.username})`,
    description,
    alternates: { canonical },
    // Profiles without posts are thin pages; keep them out of the index.
    robots: u.postCount === 0 || u.isBanned ? { index: false, follow: true } : undefined,
    openGraph: { ...OG_DEFAULTS, type: "profile", url: canonical, title: `${u.displayName} (@${u.username})`, description, username: u.username },
  };
}

export default function UserPage({ params }: PageProps<"/u/[username]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-4 px-4 pt-5">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      }
    >
      {params.then(({ username }) => (
        <Profile username={decodeURIComponent(username)} />
      ))}
    </Suspense>
  );
}

async function Profile({ username }: { username: string }) {
  const data = await getProfile(username);
  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-10">
        <EmptyState icon="🙈" title="User not found" action={<ButtonLink href="/leaderboard">See top contributors</ButtonLink>} />
      </div>
    );
  }
  const { user: u, rank } = data;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-5">
      <div className="rounded-3xl bg-white p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar name={u.displayName} size={72} />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold">{u.displayName}</h1>
            <p className="text-sm text-stone-500">@{u.username}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-stone-500">
              {u.area && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" /> {u.area}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5" /> Joined {formatDate(u.createdAt)}
              </span>
            </div>
          </div>
        </div>
        {u.bio && <p className="mt-4 text-[15px] text-stone-700">{u.bio}</p>}
        <div className="mt-5 grid grid-cols-4 divide-x divide-stone-100 rounded-2xl bg-stone-50 py-3 text-center">
          {[
            [`#${rank}`, "Rank"],
            [u.reputation, "Points"],
            [u.postCount, "Posts"],
            [u.helpfulReceived, "Helpful"],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="text-lg font-extrabold text-brand-700">{v}</div>
              <div className="text-[11px] font-semibold uppercase text-stone-400">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <h2 className="mb-3 mt-6 text-lg font-extrabold">Findings by {u.displayName}</h2>
      <UserPosts username={u.username} />
    </div>
  );
}
