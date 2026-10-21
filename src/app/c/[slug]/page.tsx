import type { Metadata } from "next";
import { Suspense } from "react";
import { Landing, LandingSkeleton } from "@/components/Landing";
import { ButtonLink, EmptyState } from "@/components/ui";
import { getCategories, getPlaces } from "@/lib/landing-data";
import { topCities } from "@/lib/places";
import { categoryHref, isListedCategory, MIN_POSTS_TO_INDEX, OG_DEFAULTS } from "@/lib/site";
import { categoryTrail } from "@/lib/structured-data";

async function load(slug: string) {
  const [categories, places] = await Promise.all([getCategories(), getPlaces()]);
  const category = categories.find((c) => c.slug === slug);
  return category ? { category, cities: topCities(places, 24, slug) } : null;
}

const describe = (name: string, count: number, cities: string[]) =>
  `Looking for the best ${name.toLowerCase()} in Bangladesh? Read ${count > 0 ? `${count} honest` : "honest"} reviews, recommendations and warnings from people who actually used them${cities.length ? ` — in ${cities.join(", ")} and more` : ""}. Compare ratings and locations before you go.`;

export async function generateMetadata({ params }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: "Category not found", robots: { index: false } };
  const { category, cities } = data;
  const count = category.postCount ?? 0;
  const title = `Best ${category.name} in Bangladesh — Reviews & Recommendations`;
  const description = describe(category.name, count, cities.slice(0, 3).map((c) => c.city));
  const canonical = categoryHref(slug);
  return {
    title: { absolute: `${title} | ${category.nameBn}` },
    description,
    alternates: { canonical },
    robots: count < MIN_POSTS_TO_INDEX || !isListedCategory(slug) ? { index: false, follow: true } : undefined,
    openGraph: { ...OG_DEFAULTS, url: canonical, title, description },
  };
}

export default function CategoryPage({ params }: PageProps<"/c/[slug]">) {
  return (
    <Suspense fallback={<LandingSkeleton />}>
      {params.then(({ slug }) => (
        <CategoryLanding slug={slug} />
      ))}
    </Suspense>
  );
}

async function CategoryLanding({ slug }: { slug: string }) {
  const data = await load(slug);
  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-10">
        <EmptyState icon="🧭" title="This category doesn't exist" action={<ButtonLink href="/explore">Explore all findings</ButtonLink>} />
      </div>
    );
  }
  const { category, cities } = data;
  return (
    <Landing
      path={categoryHref(slug)}
      title={`${category.icon} Best ${category.name} in Bangladesh`}
      titleBn={`বাংলাদেশের সেরা ${category.nameBn}`}
      intro={describe(category.name, category.postCount ?? 0, cities.slice(0, 3).map((c) => c.city))}
      trail={categoryTrail(category)}
      filter={{ category: slug }}
      chipsTitle={cities.length ? "Choose a city" : undefined}
      chips={cities.map((c) => ({ href: categoryHref(slug, c.city), label: c.city, count: c.posts }))}
      related={{ href: `/map`, label: "See everything on the map", icon: "🗺️" }}
    />
  );
}
