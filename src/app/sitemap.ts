import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { postHref } from "@/lib/format";
import { topCities } from "@/lib/places";
import { serverApi } from "@/lib/server-api";
import { absoluteUrl, categoryHref, cityHref, isListedCategory, MIN_POSTS_TO_INDEX } from "@/lib/site";
import type { Category, Place, SitemapData } from "@/lib/types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Built per request (the backend caches it for 10 minutes) so `next build` never needs the API.
  await connection();
  const [cats, places, data] = await Promise.all([
    serverApi<{ categories: Category[] }>("/categories"),
    serverApi<{ places: Place[] }>("/seo/places"),
    serverApi<SitemapData>("/seo/sitemap"),
  ]);
  const allPlaces = places?.places ?? [];
  const latest = (rows: { updatedAt: string }[]) =>
    rows.reduce<Date | undefined>((max, r) => (!max || new Date(r.updatedAt) > max ? new Date(r.updatedAt) : max), undefined);

  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "hourly", priority: 1, lastModified: latest(data?.posts.slice(0, 1) ?? []) },
    { url: absoluteUrl("/explore"), changeFrequency: "hourly", priority: 0.8 },
    { url: absoluteUrl("/leaderboard"), changeFrequency: "daily", priority: 0.4 },
    { url: absoluteUrl("/guidelines"), changeFrequency: "yearly", priority: 0.2 },
  ];

  for (const c of cats?.categories ?? []) {
    if ((c.postCount ?? 0) < MIN_POSTS_TO_INDEX || !isListedCategory(c.slug)) continue;
    pages.push({
      url: absoluteUrl(categoryHref(c.slug)),
      changeFrequency: "daily",
      priority: 0.9,
      lastModified: latest(allPlaces.filter((p) => p.category === c.slug)),
    });
  }

  for (const { city, posts } of topCities(allPlaces)) {
    if (posts < MIN_POSTS_TO_INDEX) continue;
    pages.push({
      url: absoluteUrl(cityHref(city)),
      changeFrequency: "daily",
      priority: 0.8,
      lastModified: latest(allPlaces.filter((p) => p.city.toLowerCase() === city.toLowerCase())),
    });
  }

  for (const p of allPlaces) {
    if (p.posts < MIN_POSTS_TO_INDEX || !isListedCategory(p.category)) continue;
    pages.push({
      url: absoluteUrl(categoryHref(p.category, p.city)),
      changeFrequency: "daily",
      priority: 0.8,
      lastModified: new Date(p.updatedAt),
    });
  }

  for (const p of data?.posts ?? []) {
    pages.push({
      url: absoluteUrl(postHref(p)),
      lastModified: new Date(p.updatedAt),
      changeFrequency: "weekly",
      priority: 0.7,
      ...(p.image ? { images: [absoluteUrl(p.image)] } : {}),
    });
  }

  for (const u of data?.users ?? []) {
    pages.push({ url: absoluteUrl(`/u/${u.username}`), lastModified: new Date(u.updatedAt), changeFrequency: "weekly", priority: 0.3 });
  }

  return pages;
}
