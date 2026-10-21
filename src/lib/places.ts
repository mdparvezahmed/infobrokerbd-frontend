import type { Place } from "./types";

export interface CityCount {
  city: string;
  posts: number;
}

/** Cities by number of public posts, merging case variants ("Dhaka" / "dhaka"). */
export function topCities(places: Place[], limit = Infinity, category?: string): CityCount[] {
  const byCity = new Map<string, CityCount>();
  for (const p of places) {
    if (category && p.category !== category) continue;
    const key = p.city.toLowerCase();
    const hit = byCity.get(key);
    if (hit) hit.posts += p.posts;
    else byCity.set(key, { city: p.city, posts: p.posts });
  }
  return [...byCity.values()].sort((a, b) => b.posts - a.posts).slice(0, limit);
}

/** Categories present in a city, by number of public posts. */
export function categoriesIn(places: Place[], city: string) {
  const key = city.toLowerCase();
  const byCat = new Map<string, number>();
  for (const p of places) if (p.city.toLowerCase() === key) byCat.set(p.category, (byCat.get(p.category) ?? 0) + p.posts);
  return byCat;
}

/** Display spelling of a city as stored on posts, or null if no public post mentions it. */
export function findCity(places: Place[], city: string) {
  const key = city.toLowerCase();
  return places.find((p) => p.city.toLowerCase() === key)?.city ?? null;
}
