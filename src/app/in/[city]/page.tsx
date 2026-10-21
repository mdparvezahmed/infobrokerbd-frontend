import type { Metadata } from "next";
import { Suspense } from "react";
import { Landing, LandingSkeleton } from "@/components/Landing";
import { ButtonLink, EmptyState } from "@/components/ui";
import { getCategories, getPlaces } from "@/lib/landing-data";
import { categoriesIn, findCity } from "@/lib/places";
import { categoryHref, cityFromParam, cityHref, MIN_POSTS_TO_INDEX, OG_DEFAULTS } from "@/lib/site";
import { cityTrail } from "@/lib/structured-data";

async function load(cityParam: string) {
  const [categories, places] = await Promise.all([getCategories(), getPlaces()]);
  const city = findCity(places, cityFromParam(cityParam));
  if (!city) return null;
  const inCity = categoriesIn(places, city);
  const present = categories
    .filter((c) => inCity.has(c.slug))
    .map((c) => ({ ...c, count: inCity.get(c.slug) ?? 0 }))
    .sort((a, b) => b.count - a.count);
  return { city, count: present.reduce((n, c) => n + c.count, 0), categories: present };
}

const describe = (city: string, count: number, top: string[]) =>
  `${count > 0 ? `${count} honest` : "Honest"} reviews, tips and warnings about shops, services and places in ${city}, Bangladesh${top.length ? ` — ${top.join(", ").toLowerCase()} and more` : ""}. Shared by locals who've been there.`;

export async function generateMetadata({ params }: PageProps<"/in/[city]">): Promise<Metadata> {
  const { city: cityParam } = await params;
  const data = await load(cityParam);
  if (!data) return { title: "Nothing here yet", robots: { index: false, follow: true } };
  const { city, count, categories } = data;
  const title = `Best Shops, Services & Places in ${city} — Local Reviews`;
  const description = describe(city, count, categories.slice(0, 3).map((c) => c.name));
  const canonical = cityHref(city);
  return {
    title: { absolute: `${title} | InfoBrokerBD` },
    description,
    alternates: { canonical },
    robots: count < MIN_POSTS_TO_INDEX ? { index: false, follow: true } : undefined,
    openGraph: { ...OG_DEFAULTS, url: canonical, title, description },
  };
}

export default function CityPage({ params }: PageProps<"/in/[city]">) {
  return (
    <Suspense fallback={<LandingSkeleton />}>
      {params.then(({ city }) => (
        <CityLanding cityParam={city} />
      ))}
    </Suspense>
  );
}

async function CityLanding({ cityParam }: { cityParam: string }) {
  const data = await load(cityParam);
  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-10">
        <EmptyState icon="🧭" title="Nothing shared here yet" action={<ButtonLink href="/new">Be the first to share</ButtonLink>} />
      </div>
    );
  }
  const { city, count, categories } = data;
  return (
    <Landing
      path={cityHref(city)}
      title={`📍 Best shops, services & places in ${city}`}
      titleBn={`${city}-এর সেরা দোকান, সেবা আর জায়গা`}
      intro={describe(city, count, categories.slice(0, 3).map((c) => c.name))}
      trail={cityTrail(city)}
      filter={{ city }}
      chipsTitle="What are you looking for?"
      chips={categories.map((c) => ({ href: categoryHref(c.slug, city), label: c.name, icon: c.icon, count: c.count }))}
      related={{ href: "/explore", label: "Search all of Bangladesh", icon: "🔍" }}
    />
  );
}
