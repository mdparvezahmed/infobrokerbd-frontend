import "server-only";
import { cache } from "react";
import { serverApi } from "./server-api";
import type { Category, Place, PostSearchPage } from "./types";

// Shared by generateMetadata and the page within one request.
export const getCategories = cache(async () => (await serverApi<{ categories: Category[] }>("/categories"))?.categories ?? []);
export const getPlaces = cache(async () => (await serverApi<{ places: Place[] }>("/seo/places"))?.places ?? []);

export const LANDING_PAGE_SIZE = 12;

export function landingQuery(filter: { category?: string; city?: string }, sort: "top" | "rating" | "new" = "top") {
  return { ...filter, sort, limit: LANDING_PAGE_SIZE };
}

export const getLandingPosts = cache(async (category: string | undefined, city: string | undefined, sort: "top" | "rating" | "new") => {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(landingQuery({ category, city }, sort))) if (v !== undefined) qs.set(k, String(v));
  return serverApi<PostSearchPage>(`/posts?${qs}`);
});
