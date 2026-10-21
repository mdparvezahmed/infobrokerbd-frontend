import { connection } from "next/server";
import { topCities } from "@/lib/places";
import { serverApi } from "@/lib/server-api";
import { absoluteUrl, categoryHref, cityHref, isListedCategory, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import type { Category, Place } from "@/lib/types";

const posts = (n: number) => `${n} ${n === 1 ? "post" : "posts"}`;

/** Plain-text map of the site for AI assistants (https://llmstxt.org). */
export async function GET() {
  await connection();
  const [cats, places] = await Promise.all([
    serverApi<{ categories: Category[] }>("/categories"),
    serverApi<{ places: Place[] }>("/seo/places"),
  ]);

  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `${SITE_NAME} is a community site where people in Bangladesh share first-hand reviews, recommendations, experiences, tips and scam warnings about local shops, service providers and places. Every post is pinned to a real location. Content is in English and Bangla.`,
    "",
    "## Categories",
    ...(cats?.categories ?? [])
      .filter((c) => isListedCategory(c.slug))
      .map((c) => `- [${c.name} (${c.nameBn})](${absoluteUrl(categoryHref(c.slug))}): best ${c.name.toLowerCase()} in Bangladesh, ${posts(c.postCount ?? 0)}`),
    "",
    "## Cities",
    ...topCities(places?.places ?? [], 50).map((c) => `- [Best in ${c.city}](${absoluteUrl(cityHref(c.city))}): ${posts(c.posts)}`),
    "",
    "## Pages",
    `- [Explore & search](${absoluteUrl("/explore")}): search all posts, e.g. ${absoluteUrl("/explore?q=phone+repair+mirpur")}`,
    `- [Map](${absoluteUrl("/map")}): posts on a map of Bangladesh`,
    `- [Community guidelines](${absoluteUrl("/guidelines")})`,
    `- [Sitemap](${absoluteUrl("/sitemap.xml")}): every public post`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
