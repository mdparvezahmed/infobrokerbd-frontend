import type { Metadata } from "next";
import { Suspense } from "react";
import { Landing, LandingSkeleton } from "@/components/Landing";
import { ButtonLink, EmptyState } from "@/components/ui";
import { getCategories, getPlaces } from "@/lib/landing-data";
import { categoriesIn, findCity } from "@/lib/places";
import { categoryHref, cityFromParam, cityHref, isListedCategory, MIN_POSTS_TO_INDEX, OG_DEFAULTS } from "@/lib/site";
import { categoryTrail } from "@/lib/structured-data";

async function load(slug: string, cityParam: string) {
  const [categories, places] = await Promise.all([getCategories(), getPlaces()]);
  const category = categories.find((c) => c.slug === slug);
  const city = findCity(places, cityFromParam(cityParam));
  if (!category || !city) return null;
  const inCity = categoriesIn(places, city);
  const others = categories
    .filter((c) => c.slug !== slug && inCity.has(c.slug))
    .map((c) => ({ ...c, count: inCity.get(c.slug) ?? 0 }))
    .sort((a, b) => b.count - a.count);
  return { category, city, count: inCity.get(slug) ?? 0, others };
}

const describe = (name: string, city: string, count: number) =>
  `Looking for the best ${name.toLowerCase()} in ${city}? Read ${count > 0 ? `${count} honest` : "honest"} reviews and recommendations from people in ${city}, Bangladesh who used them — with ratings, map locations and phone numbers.`;

export async function generateMetadata({ params }: PageProps<"/c/[slug]/[city]">): Promise<Metadata> {
  const { slug, city: cityParam } = await params;
  const data = await load(slug, cityParam);
  if (!data) return { title: "Nothing here yet", robots: { index: false, follow: true } };
  const { category, city, count } = data;
  const title = `Best ${category.name} in ${city} — Reviews & Recommendations`;
  const description = describe(category.name, city, count);
  const canonical = categoryHref(slug, city);
  return {
    title: { absolute: `${title} | InfoBrokerBD` },
    description,
    alternates: { canonical },
    robots: count < MIN_POSTS_TO_INDEX || !isListedCategory(slug) ? { index: false, follow: true } : undefined,
    openGraph: { ...OG_DEFAULTS, url: canonical, title, description },
  };
}

export default function CategoryCityPage({ params }: PageProps<"/c/[slug]/[city]">) {
  return (
    <Suspense fallback={<LandingSkeleton />}>
      {params.then(({ slug, city }) => (
        <CategoryCityLanding slug={slug} cityParam={city} />
      ))}
    </Suspense>
  );
}

async function CategoryCityLanding({ slug, cityParam }: { slug: string; cityParam: string }) {
  const data = await load(slug, cityParam);
  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-10">
        <EmptyState icon="🧭" title="Nothing shared here yet" action={<ButtonLink href="/new">Be the first to share</ButtonLink>} />
      </div>
    );
  }
  const { category, city, count, others } = data;
  return (
    <Landing
      path={categoryHref(slug, city)}
      title={`${category.icon} Best ${category.name} in ${city}`}
      titleBn={`${city}-এর সেরা ${category.nameBn}`}
      intro={describe(category.name, city, count)}
      trail={categoryTrail(category, city)}
      filter={{ category: slug, city }}
      chipsTitle={others.length ? `More in ${city}` : undefined}
      chips={others.map((c) => ({ href: categoryHref(c.slug, city), label: c.name, icon: c.icon, count: c.count }))}
      related={{ href: cityHref(city), label: `Everything in ${city}`, icon: "📍" }}
    />
  );
}
